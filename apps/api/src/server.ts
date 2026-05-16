import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { createApp } from './app';
import { startGracePeriodJob, stopGracePeriodJob } from './jobs/gracePeriod.job';
import { startSubscriptionJobs, stopSubscriptionJobs } from './jobs/subscription.job';
import { startCleanupJobs, stopCleanupJobs } from './jobs/cleanup.job';
import { startAutoCloseJob, stopAutoCloseJob } from './jobs/autoCloseTickets.job';
import { studioWorker } from './services/studio.worker.service';

const startServer = async () => {
  try {
    // Ensure DB connection is established
    await prisma.$connect();
    logger.info('📦 Database connected successfully');

    const app = createApp();
    
    app.listen(env.PORT, () => {
      logger.info(`🚀 DirectorByte v2 API running on http://localhost:${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);

      // Start background jobs
      startGracePeriodJob();
      startSubscriptionJobs();
      startCleanupJobs();
      startAutoCloseJob();
      studioWorker.start();
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopGracePeriodJob();
  stopSubscriptionJobs();
  stopCleanupJobs();
  stopAutoCloseJob();
  studioWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
