import fs from 'fs';
import path from 'path';
import { safeEnv } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { createApp } from './app';
import { startGracePeriodJob, stopGracePeriodJob } from './jobs/gracePeriod.job';
import { startSubscriptionJobs, stopSubscriptionJobs } from './jobs/subscription.job';
import { startCleanupJobs, stopCleanupJobs } from './jobs/cleanup.job';
import { startAutoCloseJob, stopAutoCloseJob } from './jobs/autoCloseTickets.job';
import { studioWorker } from './services/studio.worker.service';

const isInstalled = () => {
  const apiRoot = path.resolve(__dirname, '..');
  const lockFilePath = path.resolve(apiRoot, '../.install.lock');
  return fs.existsSync(lockFilePath);
};

const startServer = async () => {
  try {
    const installed = isInstalled();

    if (installed) {
      // Ensure DB connection is established if installed
      await prisma.$connect();
      logger.info('📦 Database connected successfully');
    } else {
      logger.warn('⚠️ Application is not installed. Running in Setup Mode.');
    }

    const app = createApp();
    
    app.listen(safeEnv.PORT, () => {
      logger.info(`🚀 DirectorByte v2 API running on http://localhost:${safeEnv.PORT}`);
      logger.info(`🌍 Environment: ${safeEnv.NODE_ENV}`);

      if (installed) {
        // Start background jobs only if installed
        startGracePeriodJob();
        startSubscriptionJobs();
        startCleanupJobs();
        startAutoCloseJob();
        studioWorker.start();
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    if (isInstalled()) {
      await prisma.$disconnect();
    }
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (isInstalled()) {
    stopGracePeriodJob();
    stopSubscriptionJobs();
    stopCleanupJobs();
    stopAutoCloseJob();
    studioWorker.stop();
    await prisma.$disconnect();
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
