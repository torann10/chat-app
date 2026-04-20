import bcrypt from 'bcrypt';
import prisma from '../database/prisma.js';

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: {select: {id: true, email: true, fullname: true, isOnline: true}},
};

const messageInclude = {
  sender: {select: {id: true, email: true, fullname: true}},
};

export async function createRoom(ownerId, {name, type, password, otherUserId}) {
  if (!['public', 'private', 'password', 'dm'].includes(type)) {
    const err = new Error('Invalid room type');
    err.status = 400;
    throw err;
  }

  if (type === 'dm') {
    if (!otherUserId) {
      const err = new Error('otherUserId required for DM');
      err.status = 400;
      throw err;
    }
    const existing = await prisma.room.findFirst({
      where: {
        type: 'dm',
        AND: [
          {members: {some: {userId: ownerId}}},
          {members: {some: {userId: Number(otherUserId)}}},
        ],
      },
    });
    if (existing) return existing;

    return prisma.room.create({
      data: {
        name: `dm:${[ownerId, Number(otherUserId)].sort().join(':')}`,
        type: 'dm',
        members: {
          create: [
            {userId: ownerId, role: 'admin'},
            {userId: Number(otherUserId), role: 'admin'},
          ],
        },
      },
    });
  }

  const data = {name, type};
  if (type === 'password') {
    if (!password) {
      const err = new Error('Password required for password-protected rooms');
      err.status = 400;
      throw err;
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  return prisma.room.create({
    data: {
      ...data,
      members: {create: [{userId: ownerId, role: 'admin'}]},
    },
  });
}

export async function listRooms(userId, type) {
  if (type === 'dm') {
    const rooms = await prisma.room.findMany({
      where: {type: 'dm', members: {some: {userId}}},
      select: {
        id: true, type: true, createdAt: true,
        members: {
          select: {
            role: true, joinedAt: true, unreadCount: true,
            user: {select: {id: true, email: true, fullname: true, isOnline: true}},
          },
        },
      },
      orderBy: {createdAt: 'desc'},
    });

    return rooms.map(({members, ...room}) => {
      const other = members.find(m => m.user.id !== userId);
      const mine  = members.find(m => m.user.id === userId);
      return {
        ...room,
        name: other?.user.fullname ?? other?.user.email ?? 'Unknown',
        otherUser: other?.user ?? null,
        unreadCount: mine?.unreadCount ?? 0,
      };
    });
  }

  const rooms = await prisma.room.findMany({
    where: {
      NOT: {type: 'dm'},
      OR: [
        {type: {in: ['public', 'password']}},
        {type: 'private', members: {some: {userId}}},
      ],
    },
    select: {
      id: true, name: true, type: true, createdAt: true,
      _count: {select: {members: true}},
      members: {
        where: {userId},
        select: {role: true, joinedAt: true, unreadCount: true},
      },
    },
    orderBy: {createdAt: 'desc'},
  });

  return rooms.map(({members, ...room}) => {
    const mem = members[0];
    return {
      ...room,
      membership: mem ? {role: mem.role, joinedAt: mem.joinedAt} : null,
      unreadCount: mem?.unreadCount ?? 0,
    };
  });
}

export function deleteRoom(roomId) {
  return prisma.room.delete({where: {id: roomId}});
}

export function listMembers(roomId) {
  return prisma.roomMember.findMany({
    where: {roomId},
    select: memberSelect,
    orderBy: {joinedAt: 'asc'},
  });
}

export async function addMember(roomId, userId, role = 'member') {
  const existing = await prisma.roomMember.findFirst({where: {roomId, userId}});
  if (existing) {
    const err = new Error('User is already a member of this room');
    err.status = 409;
    throw err;
  }
  return prisma.roomMember.create({
    data: {roomId, userId, role},
    select: memberSelect,
  });
}

export function removeMember(roomId, userId) {
  return prisma.roomMember.deleteMany({where: {roomId, userId}});
}

export function changeMemberRole(roomId, userId, role) {
  return prisma.roomMember.updateMany({where: {roomId, userId}, data: {role}});
}

export async function getMessages(roomId, {cursor, limit = 20}) {
  const take = Math.min(Number(limit) || 20, 100);

  const messages = await prisma.message.findMany({
    where: {
      roomId,
      ...(cursor ? {id: {lt: Number(cursor)}} : {}),
    },
    include: messageInclude,
    orderBy: {id: 'desc'},
    take: take + 1,
  });

  const hasMore = messages.length > take;
  const page = hasMore ? messages.slice(0, take) : messages;
  page.reverse();

  return {
    messages: page,
    nextCursor: hasMore ? page[0].id : null,
  };
}

export async function sendMessage(roomId, senderId, content) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {roomId, senderId, content},
      include: messageInclude,
    }),
    prisma.roomMember.updateMany({
      where: {roomId, userId: {not: senderId}},
      data: {unreadCount: {increment: 1}},
    }),
  ]);
  return message;
}

export function markAsRead(roomId, userId) {
  return prisma.roomMember.updateMany({
    where: {roomId, userId},
    data: {unreadCount: 0},
  });
}