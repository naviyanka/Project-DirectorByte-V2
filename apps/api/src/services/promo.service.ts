/**
 * Promo Code Service
 * -------------------
 * Handles all promo code validation, redemption, and discount calculation logic.
 */
import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export interface PromoDiscount {
  type: 'PERCENT' | 'FIXED' | 'TRIAL_DAYS' | 'FREE_UPGRADE';
  value: number;
  finalPrice: number;
  displayText: string;
}

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  discount?: PromoDiscount;
}

export class PromoService {
  /**
   * Validates a promo code against all business rules.
   *
   * Checks (all must pass):
   *  1. Code exists and isActive = true
   *  2. Current date within startsAt and expiresAt (if set)
   *  3. maxTotalRedemptions == 0 OR currentRedemptions < maxTotalRedemptions
   *  4. User has not exceeded maxPerUser (via PromoRedemption count)
   *  5. If firstTimeOnly: user has never had a paid subscription
   *  6. If appliesToPlanIds not empty: planId must be in the list
   */
  static async validatePromoCode(
    code: string,
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL'
  ): Promise<PromoValidationResult> {
    // 1. Code exists and is active
    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.isActive) {
      return { valid: false, error: 'Invalid or inactive promo code' };
    }

    const now = new Date();

    // 2. Date range check
    if (promo.startsAt && now < promo.startsAt) {
      return { valid: false, error: 'This promo code is not yet active' };
    }
    if (promo.expiresAt && now > promo.expiresAt) {
      return { valid: false, error: 'This promo code has expired' };
    }

    // 3. Global redemption limit
    if (promo.maxTotalRedemptions > 0 && promo.currentRedemptions >= promo.maxTotalRedemptions) {
      return { valid: false, error: 'This promo code has reached its redemption limit' };
    }

    // 4. Per-user redemption limit
    const userRedemptions = await prisma.promoRedemption.count({
      where: { promoCodeId: promo.id, userId },
    });
    if (userRedemptions >= promo.maxPerUser) {
      return { valid: false, error: 'You have already used this promo code' };
    }

    // 5. First-time only check
    if (promo.firstTimeOnly) {
      const hadPaidSub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'CANCELED', 'EXPIRED'] },
          plan: { priceMonthly: { gt: 0 } },
        },
      });
      if (hadPaidSub) {
        return { valid: false, error: 'This promo code is only available for first-time subscribers' };
      }
    }

    // 6. Plan applicability
    const appliesToPlanIds = (promo.appliesToPlanIds as string[]) || [];
    if (appliesToPlanIds.length > 0 && !appliesToPlanIds.includes(planId)) {
      return { valid: false, error: 'This promo code does not apply to the selected plan' };
    }

    // Calculate discount
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return { valid: false, error: 'Plan not found' };
    }

    const discount = this.calculateDiscount(promo, plan, billingCycle);

    return { valid: true, discount };
  }

  /**
   * Atomically redeem a promo code for a user/subscription.
   */
  static async redeemPromoCode(
    code: string,
    userId: string,
    subscriptionId: string,
    discountApplied: number
  ): Promise<void> {
    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo) throw new Error('Promo code not found');

    await prisma.$transaction(async (tx) => {
      await tx.promoRedemption.create({
        data: {
          promoCodeId: promo.id,
          userId,
          subscriptionId,
          discountApplied: new Decimal(discountApplied),
        },
      });

      await tx.promoCode.update({
        where: { id: promo.id },
        data: { currentRedemptions: { increment: 1 } },
      });
    });
  }

  /**
   * Calculate the discounted price for a plan/billing cycle given a promo code.
   */
  static calculateDiscountedPrice(
    plan: { priceMonthly: Decimal; priceAnnual: Decimal },
    billingCycle: 'MONTHLY' | 'ANNUAL',
    discount: PromoDiscount
  ): number {
    const basePrice = billingCycle === 'MONTHLY'
      ? Number(plan.priceMonthly)
      : Number(plan.priceAnnual);

    if (discount.type === 'TRIAL_DAYS' || discount.type === 'FREE_UPGRADE') {
      return basePrice; // Price doesn't change, trial is extended or plan is upgraded
    }

    return Math.max(0, discount.finalPrice);
  }

  /**
   * Internal: compute the discount details from a promo record and plan.
   */
  private static calculateDiscount(
    promo: {
      discountType: string;
      discountValue: Decimal;
      trialDays: number | null;
      freeUpgradePlanId: string | null;
    },
    plan: { priceMonthly: Decimal; priceAnnual: Decimal },
    billingCycle: 'MONTHLY' | 'ANNUAL'
  ): PromoDiscount {
    const basePrice = billingCycle === 'MONTHLY'
      ? Number(plan.priceMonthly)
      : Number(plan.priceAnnual);
    const value = Number(promo.discountValue);

    switch (promo.discountType) {
      case 'PERCENT': {
        const discountAmount = (basePrice * value) / 100;
        return {
          type: 'PERCENT',
          value,
          finalPrice: Math.max(0, basePrice - discountAmount),
          displayText: `${value}% off`,
        };
      }
      case 'FIXED': {
        return {
          type: 'FIXED',
          value,
          finalPrice: Math.max(0, basePrice - value),
          displayText: `$${value} off`,
        };
      }
      case 'TRIAL_DAYS': {
        return {
          type: 'TRIAL_DAYS',
          value: promo.trialDays || value,
          finalPrice: basePrice,
          displayText: `${promo.trialDays || value} days free trial`,
        };
      }
      case 'FREE_UPGRADE': {
        return {
          type: 'FREE_UPGRADE',
          value: 0,
          finalPrice: 0,
          displayText: 'Free upgrade',
        };
      }
      default:
        return { type: 'PERCENT', value: 0, finalPrice: basePrice, displayText: 'No discount' };
    }
  }
}
