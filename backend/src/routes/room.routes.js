import {Router} from 'express';
import bcrypt from 'bcrypt';
import prisma from '../database/prisma.js';
import {requireAuth} from '../middleware/auth.js';
import {validateBody, validateQuery} from '../middleware/validate.js';
import * as roomService from '../services/room.service.js';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  ChangeMemberRoleSchema,
  SendMessageSchema,
  ListRoomsQuerySchema,
  ListMessagesQuerySchema,
} from 'shared';

const router = Router();
router.use(requireAuth);

async function getMembership(req, res, roomId) {
  const room = await prisma.room.findUnique({where: {id: roomId}});
  if (!room) {
    res.status(404).json({error: 'Room not found'});
    return null;
  }

  const membership = await prisma.roomMember.findFirst({
    where: {roomId, userId: req.user.id},
  });
  if (!membership) {
    res.status(403).json({error: 'Not a member of this room'});
    return null;
  }

  return {room, membership};
}

function emit(req, roomId, event, payload) {
  req.app.locals.io?.to(`room:${roomId}`).emit(event, payload);
}

function notifyInvitedMembers(req, roomId, memberIds, excludeId) {
  const io = req.app.locals.io;
  if (!io) return;
  for (const userId of memberIds) {
    if (userId === excludeId) continue;
    io.in(`user:${userId}`).socketsJoin(`room:${roomId}`);
    io.to(`user:${userId}`).emit('room_invited', {roomId});
  }
}

router.post('/', validateBody(CreateRoomSchema), async (req, res) => {
  try {
    const {type, password, userId: otherUserId} = req.body;
    const name = req.body.name ?? null;
    const room = await roomService.createRoom(req.user.id, {name, type, password, otherUserId});

    const io = req.app.locals.io;

    io?.in(`user:${req.user.id}`).socketsJoin(`room:${room.id}`);

    if (type === 'dm' && otherUserId) {
      notifyInvitedMembers(req, room.id, [Number(otherUserId)], req.user.id);
    }

    res.status(201).json({
      ...room,
      membership: {role: 'admin', joinedAt: new Date()},
      unreadCount: 0
    });
  } catch (err) {
    res.status(err.status ?? 400).json({error: err.message});
  }
});

router.get('/', validateQuery(ListRoomsQuerySchema), async (req, res) => {
  try {
    const rooms = await roomService.listRooms(req.user.id, req.query.type);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;
    if (ctx.membership.role !== 'admin') {
      return res.status(403).json({error: 'Only admins can delete rooms'});
    }

    await roomService.deleteRoom(roomId);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;
    res.json(await roomService.listMembers(roomId));
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.post('/:id/members', validateBody(JoinRoomSchema), async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const {userId, role, password} = req.body;

    const room = await prisma.room.findUnique({where: {id: roomId}});
    if (!room) return res.status(404).json({error: 'Room not found'});
    if (room.type === 'dm') return res.status(400).json({error: 'Cannot add members to DM rooms'});

    const requester = await prisma.roomMember.findFirst({
      where: {roomId, userId: req.user.id},
    });
    const isAdmin = requester?.role === 'admin';

    const isSelf = !userId || Number(userId) === req.user.id;
    const targetId = isSelf ? req.user.id : Number(userId);

    if (room.type === 'private' && !isAdmin) {
      return res.status(403).json({error: 'Only admins can add members to private rooms'});
    }
    if (room.type === 'password' && !isAdmin) {
      const valid = password && await bcrypt.compare(password, room.passwordHash);
      if (!valid) return res.status(403).json({error: 'Invalid room password'});
    }
    if (!isAdmin && !isSelf) {
      return res.status(403).json({error: 'You can only add yourself to this room'});
    }

    const assignedRole = isAdmin && role ? role : 'member';
    const member = await roomService.addMember(roomId, targetId, assignedRole);

    if (isSelf) {
      req.app.locals.io?.in(`user:${req.user.id}`).socketsJoin(`room:${roomId}`);
    } else {
      notifyInvitedMembers(req, roomId, [targetId], req.user.id);
    }

    res.status(201).json(member);
  } catch (err) {
    res.status(err.status ?? 400).json({error: err.message});
  }
});

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const targetId = Number(req.params.userId);

    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;

    const isSelf = targetId === req.user.id;
    if (!isSelf && ctx.membership.role !== 'admin') {
      return res.status(403).json({error: 'Only admins can remove other members'});
    }

    await roomService.removeMember(roomId, targetId);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.patch('/:id/members/:userId', validateBody(ChangeMemberRoleSchema), async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const targetId = Number(req.params.userId);
    const {role} = req.body;

    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;
    if (ctx.membership.role !== 'admin') {
      return res.status(403).json({error: 'Only admins can change member roles'});
    }

    await roomService.changeMemberRole(roomId, targetId, role);
    res.json({roomId, userId: targetId, role});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});


router.get('/:id/messages', validateQuery(ListMessagesQuerySchema), async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;
    res.json(await roomService.getMessages(roomId, req.query));
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;
    await roomService.markAsRead(roomId, req.user.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.post('/:id/messages', validateBody(SendMessageSchema), async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const ctx = await getMembership(req, res, roomId);
    if (!ctx) return;

    const message = await roomService.sendMessage(roomId, req.user.id, req.body.content);

    emit(req, roomId, 'new_message', message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

export default router;