import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';

const connectionCount = new Map();

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    let token = socket.handshake.auth.token;

    if (!token && socket.handshake.headers['authorization']) {
      token = socket.handshake.headers['authorization'].split(' ')[1];
    }

    if (!token) return next(new Error('Authentication error: No token provided'));

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decodedUser;
      next();
    });
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.id} (userId: ${userId})`);

    socket.join(`user:${userId}`);

    const prev = connectionCount.get(userId) ?? 0;
    connectionCount.set(userId, prev + 1);

    if (prev === 0) {
      await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
      io.emit('user_status_change', { userId, isOnline: true });
    }

    const memberships = await prisma.roomMember.findMany({ where: { userId } });
    memberships.forEach(({ roomId }) => socket.join(`room:${roomId}`));

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id} (userId: ${userId})`);

      const remaining = (connectionCount.get(userId) ?? 1) - 1;

      if (remaining <= 0) {
        connectionCount.delete(userId);
        await prisma.user.update({ where: { id: userId }, data: { isOnline: false } });
        io.emit('user_status_change', { userId, isOnline: false });
      } else {
        connectionCount.set(userId, remaining);
      }
    });
  });

  return io;
}