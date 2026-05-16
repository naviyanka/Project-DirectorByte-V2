/**
 * Subscription Background Jobs
 * - check-expiring-trials: trials ending in 3 days
 * - check-renewals: subs ending in 7d and 1d
 * - reset-monthly-usage: for manual subs with expired periods
 */
import { prisma } from '../config/database';
import { UsageService } from '../services/usage.service';
import { logger } from '../config/logger';

const ONE_DAY = 86400000;

async function checkExpiringTrials() {
  try {
    const threeDaysFromNow = new Date(Date.now() + 3 * ONE_DAY);
    const startOfDay = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate());
    const endOfDay = new Date(startOfDay.getTime() + ONE_DAY);

    const expiring = await prisma.subscription.findMany({
      where: { status: 'TRIALING', trialEnd: { gte: startOfDay, lt: endOfDay } },
    });
    if (expiring.length > 0) {
      logger.info({ count: expiring.length }, 'Expiring trials found (3 days)');
    }
  } catch (error) { logger.error({ err: error }, 'checkExpiringTrials failed'); }
}

async function checkRenewals() {
  try {
    for (const daysAhead of [7, 1]) {
      const target = new Date(Date.now() + daysAhead * ONE_DAY);
      const startOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const endOfDay = new Date(startOfDay.getTime() + ONE_DAY);

      const subs = await prisma.subscription.findMany({
        where: { status: 'ACTIVE', currentPeriodEnd: { gte: startOfDay, lt: endOfDay } },
      });
      if (subs.length > 0) {
        logger.info({ count: subs.length, daysAhead }, 'Renewal reminders');
      }
    }
  } catch (error) { logger.error({ err: error }, 'checkRenewals failed'); }
}

async function resetManualUsage() {
  try {
    const now = new Date();
    const expired = await prisma.subscription.findMany({
      where: { manuallyAssigned: true, status: 'ACTIVE', currentPeriodEnd: { lt: now } },
    });
    for (const sub of expired) {
      const newEnd = new Date(now.getTime() + 30 * ONE_DAY);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { currentPeriodStart: now, currentPeriodEnd: newEnd },
      });
      await UsageService.resetUsageForPeriod(sub.userId, now, newEnd);
    }
    if (expired.length > 0) logger.info({ count: expired.length }, 'Manual usage reset');
  } catch (error) { logger.error({ err: error }, 'resetManualUsage failed'); }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSubscriptionJobs() {
  logger.info('Starting subscription background jobs (daily)');
  const run = async () => {
    await checkExpiringTrials();
    await checkRenewals();
    await resetManualUsage();
  };
  run();
  intervalId = setInterval(run, ONE_DAY);
}

export function stopSubscriptionJobs() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}
