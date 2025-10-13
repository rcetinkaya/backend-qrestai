/**
 * Prisma Database Client
 * Singleton pattern to ensure single instance
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// PrismaClient is attached to the `global` object in development
// to prevent exhausting database connection limit
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown
const disconnect = async () => {
  await prisma.$disconnect();
};

process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);
