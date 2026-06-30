import { PrismaClient } from '@prisma/client';
import { config } from './environment';

export const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
