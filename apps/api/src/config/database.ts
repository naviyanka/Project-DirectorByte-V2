import { PrismaClient } from '@prisma/client';
import { safeEnv } from './env';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

const isInstalled = () => {
  const lockFilePath = path.resolve(__dirname, '../../../../.install.lock');
  return fs.existsSync(lockFilePath);
};

const prismaClientSingleton = () => {
  // If not installed, return a proxy that throws a clear error if used before setup
  if (!isInstalled()) {
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect') return async () => {};
        if (prop === '$disconnect') return async () => {};
        throw new Error(`PrismaClient used before installation (called property: ${String(prop)})`);
      }
    });
  }

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

if (safeEnv.NODE_ENV !== 'production' && isInstalled()) globalThis.prisma = prisma;

if (isInstalled()) {
  const p = prisma as any;
  if (p.$on) {
    p.$on('error', (e: any) => {
      logger.error(e, 'Prisma Client Error');
    });

    if (safeEnv.NODE_ENV === 'development') {
      p.$on('warn', (e: any) => {
        logger.warn(e, 'Prisma Client Warning');
      });
    }
  }
}
