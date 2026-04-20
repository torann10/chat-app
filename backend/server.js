import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import passport from 'passport';

import prisma from './src/database/prisma.js';
import { configurePassport } from './src/config/passport.js';
import { initSocket } from './src/config/socket.js';
import authRouter from './src/routes/auth.routes.js';
import roomRouter from './src/routes/room.routes.js';
import userRouter from './src/routes/user.routes.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

configurePassport(passport);

const httpServer = createServer(app);
const io = initSocket(httpServer);
app.locals.io = io;

await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');

app.use('/auth', authRouter);
app.use('/rooms', roomRouter);
app.use('/users', userRouter);

httpServer.listen(3000, () => {
  console.log('Socket.IO server running on http://localhost:3000');
});