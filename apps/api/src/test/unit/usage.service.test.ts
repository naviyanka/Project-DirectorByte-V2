import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsageService, QuotaExceededError } from '../../services/usage.service';
import { prisma } from '../../config/database';

vi.mock('../../config/database', () => ({
  prisma: {
    subscriptionUsage: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('UsageService', () => {
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('decrementCredits', () => {
    it('decrements credits successfully when under limit', async () => {
      const mockUsage = { userId, creditsUsed: 10, creditsLimit: 100 };
      vi.mocked(prisma.subscriptionUsage.findUnique).mockResolvedValue(mockUsage as any);

      await UsageService.decrementCredits(userId, 10, 'studio');

      expect(prisma.subscriptionUsage.update).toHaveBeenCalledWith({
        where: { userId },
        data: { creditsUsed: { increment: 10 } }
      });
    });

    it('throws QuotaExceededError when over limit', async () => {
      const mockUsage = { userId, creditsUsed: 95, creditsLimit: 100 };
      vi.mocked(prisma.subscriptionUsage.findUnique).mockResolvedValue(mockUsage as any);

      await expect(UsageService.decrementCredits(userId, 10, 'studio'))
        .rejects.toThrow(QuotaExceededError);
      
      expect(prisma.subscriptionUsage.update).not.toHaveBeenCalled();
    });
  });

  describe('checkProjectLimit', () => {
    it('returns true if under limit', async () => {
      vi.mocked(prisma.subscriptionUsage.findUnique).mockResolvedValue({ projectsCount: 2, projectsLimit: 5 } as any);
      const result = await UsageService.checkProjectLimit(userId);
      expect(result).toBe(true);
    });

    it('returns false if at limit', async () => {
      vi.mocked(prisma.subscriptionUsage.findUnique).mockResolvedValue({ projectsCount: 5, projectsLimit: 5 } as any);
      const result = await UsageService.checkProjectLimit(userId);
      expect(result).toBe(false);
    });

    it('returns true if unlimited (-1)', async () => {
      vi.mocked(prisma.subscriptionUsage.findUnique).mockResolvedValue({ projectsCount: 100, projectsLimit: -1 } as any);
      const result = await UsageService.checkProjectLimit(userId);
      expect(result).toBe(true);
    });
  });

  describe('resetUsageForPeriod', () => {
    it('resets usage counters', async () => {
      const periodStart = new Date();
      const periodEnd = new Date();
      
      await UsageService.resetUsageForPeriod(userId, periodStart, periodEnd);

      expect(prisma.subscriptionUsage.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          creditsUsed: 0,
          exportsCount: 0,
          periodStart,
          periodEnd
        })
      });
    });
  });
});
