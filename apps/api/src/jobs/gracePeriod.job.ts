/**
 * Grace Period Expiration Job
 * ----------------------------
 * A simple in-memory interval job that runs daily to check for subscriptions
 * whose grace period has expired and downgrades them to the Free plan.
 */
import { SubscriptionService } from '../services/subscription.service';
import { logger } from '../config/logger';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let intervalId: ReturnType<typeof setInterval> | null = null;

async function runGracePeriodCheck() {
  try {
    const result = await SubscriptionService.handleExpiredGracePeriods();
    if (result.processed > 0) {
      logger.info({ processed: result.processed }, 'Grace period job: downgraded expired subscriptions');
    }
  } catch (error) {
    logger.error({ err: error }, 'Grace period job failed');
  }
}

export function startGracePeriodJob() {
  logger.info('Starting grace period expiration job (daily interval)');
  // Run once at startup, then every 24 hours
  runGracePeriodCheck();
  intervalId = setInterval(runGracePeriodCheck, ONE_DAY_MS);
}

export function stopGracePeriodJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Grace period job stopped');
  }
}
