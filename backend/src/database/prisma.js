import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbUrl = pathToFileURL(join(__dirname, '../../chat.db')).href;

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || defaultDbUrl });

const prisma = new PrismaClient({ adapter });

export default prisma;