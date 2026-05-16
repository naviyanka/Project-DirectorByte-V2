import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') globalThis.prisma = prisma;

prisma.$on('error', (e: any) => {
  logger.error(e, 'Prisma Client Error');
});

if (env.NODE_ENV === 'development') {
  prisma.$on('warn', (e: any) => {
    logger.warn(e, 'Prisma Client Warning');
  });
}
