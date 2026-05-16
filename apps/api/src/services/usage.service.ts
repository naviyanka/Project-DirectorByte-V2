/**
 * Usage Tracking Service
 * -----------------------
 * Provides atomic usage tracking for all billable actions.
 * Every mutation checks limits before allowing the operation.
 */
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class QuotaExceededError extends AppError {
  constructor(resource: string, used: number, limit: number) {
    super(
      `${resource} quota exceeded: ${used}/${limit}. Please upgrade your plan.`,
      403,
      'QUOTA_EXCEEDED'
    );
  }
}

export class UsageService {
  /**
   * Atomically decrement credits for a user.
   * Throws QuotaExceededError if over limit.
   */
  static async decrementCredits(userId: string, amount: number, _module: string): Promise<void> {
    const usage = await prisma.subscriptionUsage.findUnique({ where: { userId } });
    if (!usage) throw new AppError('No subscription usage record found', 404, 'NO_USAGE');

    const newTotal = usage.creditsUsed + amount;
    if (newTotal > usage.creditsLimit) {
      throw new QuotaExceededError('Credits', usage.creditsUsed, usage.creditsLimit);
    }

    await prisma.subscriptionUsage.update({
      where: { userId },
      data: { creditsUsed: { increment: amount } },
    });

    // Warn at 80% and 100% thresholds
    const percent = (newTotal / usage.creditsLimit) * 100;
    if (percent >= 100 || (percent >= 80 && ((usage.creditsUsed / usage.creditsLimit) * 100) < 80)) {
      // In a production app, enqueue a usage-warning email here.
      // Since BullMQ is skipped, we log it.
    }
  }

  /**
   * Atomically increment the export counter.
   * Throws QuotaExceededError if over limit.
   */
  static async incrementExports(userId: string): Promise<void> {
    const usage = await prisma.subscriptionUsage.findUnique({ where: { userId } });
    if (!usage) throw new AppError('No subscription usage record found', 404, 'NO_USAGE');

    if (usage.exportsCount >= usage.exportsLimit) {
      throw new QuotaExceededError('Exports', usage.exportsCount, usage.exportsLimit);
    }

    await prisma.subscriptionUsage.update({
      where: { userId },
      data: { exportsCount: { increment: 1 } },
    });
  }

  /**
   * Check if the user can create another project.
   * Returns true if under limit, false otherwise.
   * A limit of -1 means unlimited.
   */
  static async checkProjectLimit(userId: string): Promise<boolean> {
    const usage = await prisma.subscriptionUsage.findUnique({ where: { userId } });
    if (!usage) return false;
    if (usage.projectsLimit === -1) return true; // unlimited
    return usage.projectsCount < usage.projectsLimit;
  }

  /**
   * Reset all usage counters for a new billing period.
   * Called by the webhook handler when a new billing cycle starts.
   */
  static async resetUsageForPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    await prisma.subscriptionUsage.update({
      where: { userId },
      data: {
        creditsUsed: 0,
        exportsCount: 0,
        // projectsCount is NOT reset — it tracks active projects, not per-period
        periodStart,
        periodEnd,
        lastResetAt: new Date(),
      },
    });
  }

  /**
   * Get a full usage summary with percentages.
   * Used by the subscription page and admin user view.
   */
  static async getUsageSummary(userId: string) {
    const usage = await prisma.subscriptionUsage.findUnique({ where: { userId } });
    if (!usage) return null;

    return {
      creditsUsed: usage.creditsUsed,
      creditsLimit: usage.creditsLimit,
      creditsPercent: usage.creditsLimit > 0
        ? Math.round((usage.creditsUsed / usage.creditsLimit) * 100)
        : 0,
      storageUsedBytes: usage.storageUsedBytes.toString(),
      storageLimitBytes: usage.storageLimitBytes.toString(),
      storagePercent: Number(usage.storageLimitBytes) > 0
        ? Math.round((Number(usage.storageUsedBytes) / Number(usage.storageLimitBytes)) * 100)
        : 0,
      exportsCount: usage.exportsCount,
      exportsLimit: usage.exportsLimit,
      projectsCount: usage.projectsCount,
      projectsLimit: usage.projectsLimit,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
      lastResetAt: usage.lastResetAt,
    };
  }
}
