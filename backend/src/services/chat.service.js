import prisma from '../database/prisma.js';

export const saveMessage = (roomId, senderId, content) => 
  prisma.message.create({
    data: {roomId, senderId, content},
  });

export const getMessagesByRoom = (roomId, limit = 50) =>
  prisma.message.findMany({
    where: {roomId},
    include: {sender: {select: {id: true, fullname: true, email: true}}},
    orderBy: {createdAt: 'desc'},
    take: limit,
  }).then((msgs) => msgs.reverse());