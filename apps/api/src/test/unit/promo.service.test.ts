import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromoService } from '../../services/promo.service';
import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

vi.mock('../../config/database', () => ({
  prisma: {
    promoCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    promoRedemption: {
      count: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
  }
}));

describe('PromoService', () => {
  const userId = 'user-1';
  const planId = 'plan-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePromoCode', () => {
    it('returns discount for valid PERCENT code', async () => {
      const mockPromo = {
        id: 'promo-1',
        code: 'SAVE50',
        isActive: true,
        discountType: 'PERCENT',
        discountValue: new Decimal(50),
        maxPerUser: 1,
        maxTotalRedemptions: 0,
        appliesToPlanIds: [],
      };

      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue(mockPromo as any);
      vi.mocked(prisma.promoRedemption.count).mockResolvedValue(0);
      vi.mocked(prisma.plan.findUnique).mockResolvedValue({ 
        id: planId, 
        priceMonthly: new Decimal(100),
        priceAnnual: new Decimal(1000)
      } as any);

      const result = await PromoService.validatePromoCode('SAVE50', userId, planId, 'MONTHLY');

      expect(result.valid).toBe(true);
      expect(result.discount?.finalPrice).toBe(50);
      expect(result.discount?.displayText).toBe('50% off');
    });

    it('rejects expired code', async () => {
      const mockPromo = {
        code: 'OLD',
        isActive: true,
        expiresAt: new Date(Date.now() - 10000),
      };

      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue(mockPromo as any);

      const result = await PromoService.validatePromoCode('OLD', userId, planId, 'MONTHLY');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('rejects if already used by user', async () => {
      const mockPromo = {
        id: 'promo-1',
        isActive: true,
        maxPerUser: 1,
      };

      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue(mockPromo as any);
      vi.mocked(prisma.promoRedemption.count).mockResolvedValue(1);

      const result = await PromoService.validatePromoCode('USED', userId, planId, 'MONTHLY');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already used');
    });
  });
});
