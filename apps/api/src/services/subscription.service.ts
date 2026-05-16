/**
 * Subscription Service
 * ---------------------
 * Encapsulates subscription lifecycle rules:
 * 1. New signup → Free plan assigned on registration
 * 2. Upgrade → Immediate, prorated charge
 * 3. Downgrade → Takes effect at next billing period
 * 4. Cancel → Access until period ends (default) or immediate
 * 5. Grace period → On payment failure, features stay active for N days
 * 6. Grace period end → Downgrade to Free plan (daily job)
 * 7. Reactivation → Within grace period: charge & restore. After: new checkout.
 * 8. Plan deleted → Grandfathered. New signups can't choose it.
 * 9. Promo price = $0 → No payment method collected. Sub created normally.
 * 10. Trial end → Email 3 days before. No payment method → downgrade to Free.
 */
import { prisma } from '../config/database';
import { AppError, ForbiddenError } from '../utils/errors';
import { StripeGateway } from '../providers/payment/stripe.gateway';
import { PromoService } from './promo.service';
import { UsageService } from './usage.service';
import { env } from '../config/env';
import { Decimal } from '@prisma/client/runtime/library';

const GRACE_PERIOD_DAYS = 7;

function getGateway() {
  return new StripeGateway();
}

export class SubscriptionService {
  /** Get the full subscription detail for a user */
  static async getMySubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: true,
        usage: true,
        promoCode: true,
        paymentRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, amount: true, currency: true,
            status: true, paidAt: true, invoiceUrl: true,
          },
        },
      },
    });
    if (!sub) return null;

    const usage = sub.usage ? await UsageService.getUsageSummary(userId) : null;

    return {
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billingCycle,
      plan: {
        id: sub.plan.id, name: sub.plan.name, slug: sub.plan.slug,
        priceMonthly: sub.plan.priceMonthly, priceAnnual: sub.plan.priceAnnual,
        features: sub.plan.features, limits: sub.plan.limits,
      },
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt,
      trialStart: sub.trialStart,
      trialEnd: sub.trialEnd,
      promoCode: sub.promoCode ? {
        code: sub.promoCode.code,
        discountType: sub.promoCode.discountType,
        discountValue: sub.promoCode.discountValue,
      } : null,
      usage,
      paymentHistory: sub.paymentRecords,
    };
  }

  /** Create a checkout session or provision a free subscription */
  static async checkout(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL',
    promoCode?: string
  ) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new AppError('Plan not found or inactive', 404, 'PLAN_NOT_FOUND');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    let discount = null;
    let finalPrice = billingCycle === 'MONTHLY' ? Number(plan.priceMonthly) : Number(plan.priceAnnual);
    let trialDays = plan.trialDays || 0;

    // Validate promo
    if (promoCode) {
      const result = await PromoService.validatePromoCode(promoCode, userId, planId, billingCycle);
      if (!result.valid) throw new AppError(result.error || 'Invalid promo code', 400, 'INVALID_PROMO');
      discount = result.discount!;
      finalPrice = PromoService.calculateDiscountedPrice(plan, billingCycle, discount);
      if (discount.type === 'TRIAL_DAYS') trialDays = discount.value;
    }

    // $0 checkout — skip payment gateway entirely (Rule 9)
    if (finalPrice <= 0) {
      return this.provisionFreeSubscription(userId, plan, billingCycle, promoCode, trialDays);
    }

    // Existing subscription? Handle upgrade/downgrade
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.gatewaySubscriptionId && existing.status === 'ACTIVE') {
      return this.handlePlanChange(existing, plan, billingCycle, discount);
    }

    // New paid checkout via Stripe
    const gateway = getGateway();
    const priceId = billingCycle === 'MONTHLY' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;
    if (!priceId) throw new AppError('No Stripe price configured for this plan/cycle', 500, 'NO_PRICE_ID');

    let couponId: string | undefined;
    if (discount && (discount.type === 'PERCENT' || discount.type === 'FIXED')) {
      couponId = await gateway.createCoupon({
        percentOff: discount.type === 'PERCENT' ? discount.value : undefined,
        amountOff: discount.type === 'FIXED' ? Math.round(discount.value * 100) : undefined,
        currency: plan.currency.toLowerCase(),
        duration: 'once',
      });
    }

    const session = await gateway.createCheckoutSession({
      userId, planId, planName: plan.name, priceId,
      billingCycle, amount: Math.round(finalPrice * 100),
      currency: plan.currency, customerEmail: user.email,
      trialDays: trialDays > 0 ? trialDays : undefined,
      couponId,
      successUrl: `${env.APP_URL}/dashboard?checkout=success`,
      cancelUrl: `${env.APP_URL}/pricing?checkout=canceled`,
    });

    return { checkoutUrl: session.checkoutUrl };
  }

  /** Provision a subscription that costs $0 (Rule 9) */
  private static async provisionFreeSubscription(
    userId: string,
    plan: any,
    billingCycle: 'MONTHLY' | 'ANNUAL',
    promoCode?: string,
    trialDays = 0
  ) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + (billingCycle === 'MONTHLY' ? 30 : 365));

    const sub = await prisma.$transaction(async (tx) => {
      // Deactivate existing
      await tx.subscription.deleteMany({ where: { userId } });

      const subscription = await tx.subscription.create({
        data: {
          userId, planId: plan.id,
          status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
          billingCycle, gateway: 'MANUAL', manuallyAssigned: true,
          currentPeriodStart: now, currentPeriodEnd: periodEnd,
          trialStart: trialDays > 0 ? now : null,
          trialEnd: trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000) : null,
        },
      });

      // Create WAIVED payment record
      await tx.paymentRecord.create({
        data: {
          subscriptionId: subscription.id, userId,
          gateway: 'MANUAL', amount: new Decimal(0),
          currency: plan.currency, status: 'WAIVED', paidAt: now,
        },
      });

      // Reset usage
      const limits = plan.limits as any;
      await tx.subscriptionUsage.upsert({
        where: { userId },
        create: {
          subscriptionId: subscription.id, userId,
          creditsLimit: limits?.creditsPerMonth || 50,
          storageLimitBytes: BigInt((limits?.storageGb || 2) * 1024 * 1024 * 1024),
          exportsLimit: limits?.maxExportsPerMonth || 10,
          projectsLimit: limits?.maxProjects || 5,
          periodStart: now, periodEnd,
        },
        update: {
          subscriptionId: subscription.id,
          creditsUsed: 0, exportsCount: 0,
          creditsLimit: limits?.creditsPerMonth || 50,
          storageLimitBytes: BigInt((limits?.storageGb || 2) * 1024 * 1024 * 1024),
          exportsLimit: limits?.maxExportsPerMonth || 10,
          projectsLimit: limits?.maxProjects || 5,
          periodStart: now, periodEnd, lastResetAt: now,
        },
      });

      if (promoCode) {
        await PromoService.redeemPromoCode(promoCode, userId, subscription.id, 0);
      }

      return subscription;
    });

    return { success: true, subscription: sub };
  }

  /** Handle upgrade/downgrade for an existing subscription (Rules 2 & 3) */
  private static async handlePlanChange(
    existing: any, newPlan: any, billingCycle: 'MONTHLY' | 'ANNUAL',
    discount: any
  ) {
    const currentPlan = await prisma.plan.findUnique({ where: { id: existing.planId } });
    if (!currentPlan) throw new AppError('Current plan not found', 500, 'PLAN_ERROR');

    const currentPrice = Number(currentPlan.priceMonthly);
    const newPrice = Number(newPlan.priceMonthly);
    const isUpgrade = newPrice > currentPrice;

    const gateway = getGateway();
    const priceId = billingCycle === 'MONTHLY' ? newPlan.stripePriceIdMonthly : newPlan.stripePriceIdAnnual;
    if (!priceId) throw new AppError('No Stripe price for this plan', 500, 'NO_PRICE_ID');

    // Rule 2: Upgrades take effect immediately with proration
    // Rule 3: Downgrades take effect at next billing period
    await gateway.updateSubscription(existing.gatewaySubscriptionId, {
      priceId,
      prorationBehavior: isUpgrade ? 'create_prorations' : 'none',
    });

    await prisma.subscription.update({
      where: { id: existing.id },
      data: { planId: newPlan.id, billingCycle },
    });

    return {
      success: true,
      type: isUpgrade ? 'upgrade' : 'downgrade',
      effectiveAt: isUpgrade ? 'immediately' : existing.currentPeriodEnd,
    };
  }

  /** Cancel subscription (Rule 4) */
  static async cancel(userId: string, immediately = false, reason?: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub || sub.status === 'EXPIRED' || sub.status === 'CANCELED') {
      throw new AppError('No active subscription to cancel', 400, 'NO_SUB');
    }

    if (sub.gatewaySubscriptionId) {
      const gateway = getGateway();
      await gateway.cancelSubscription(sub.gatewaySubscriptionId, immediately);
    }

    const updates: any = { canceledAt: new Date() };
    if (immediately) {
      updates.status = 'CANCELED';
    } else {
      updates.cancelAtPeriodEnd = true;
    }

    await prisma.subscription.update({ where: { userId }, data: updates });

    return {
      success: true,
      accessUntil: immediately ? new Date() : sub.currentPeriodEnd,
    };
  }

  /** Reactivate a canceled subscription (Rule 7) */
  static async reactivate(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new AppError('No subscription found', 404, 'NO_SUB');

    // If just cancel-at-period-end, clear the flag
    if (sub.cancelAtPeriodEnd && sub.status === 'ACTIVE') {
      if (sub.gatewaySubscriptionId) {
        const gateway = getGateway();
        await gateway.updateSubscription(sub.gatewaySubscriptionId, {});
      }
      const updated = await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: false, canceledAt: null },
      });
      return updated;
    }

    // If in grace period
    if (sub.gracePeriodEnd && sub.gracePeriodEnd > new Date()) {
      const updated = await prisma.subscription.update({
        where: { userId },
        data: { status: 'ACTIVE', cancelAtPeriodEnd: false, canceledAt: null, gracePeriodEnd: null },
      });
      return updated;
    }

    // Expired — need new checkout
    throw new ForbiddenError('Subscription expired. Please start a new checkout.');
  }

  /** Change billing cycle (Rule: apply at next renewal) */
  static async changeBillingCycle(userId: string, billingCycle: 'MONTHLY' | 'ANNUAL') {
    const sub = await prisma.subscription.findUnique({
      where: { userId }, include: { plan: true },
    });
    if (!sub) throw new AppError('No subscription found', 404, 'NO_SUB');

    const nextAmount = billingCycle === 'MONTHLY'
      ? Number(sub.plan.priceMonthly) : Number(sub.plan.priceAnnual);

    await prisma.subscription.update({
      where: { userId }, data: { billingCycle },
    });

    return { success: true, nextAmount, nextRenewalDate: sub.currentPeriodEnd };
  }

  /** Apply a promo code to an existing subscription */
  static async applyPromo(userId: string, code: string) {
    const sub = await prisma.subscription.findUnique({
      where: { userId }, include: { plan: true },
    });
    if (!sub) throw new AppError('No subscription found', 404, 'NO_SUB');

    const result = await PromoService.validatePromoCode(code, userId, sub.planId, sub.billingCycle as any);
    if (!result.valid) throw new AppError(result.error || 'Invalid promo', 400, 'INVALID_PROMO');

    const discount = result.discount!;
    const newAmount = PromoService.calculateDiscountedPrice(sub.plan, sub.billingCycle as any, discount);

    await PromoService.redeemPromoCode(code, userId, sub.id, Number(sub.plan.priceMonthly) - newAmount);

    await prisma.subscription.update({
      where: { userId },
      data: {
        promoCodeId: (await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } }))?.id,
        discountPercent: discount.type === 'PERCENT' ? new Decimal(discount.value) : null,
        discountFixed: discount.type === 'FIXED' ? new Decimal(discount.value) : null,
      },
    });

    return { discount, newAmount };
  }

  /** Get paginated invoice list */
  static async getInvoices(userId: string, page = 1, perPage = 20) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { data: [], meta: { page, perPage, total: 0, totalPages: 0 } };

    const total = await prisma.paymentRecord.count({ where: { subscriptionId: sub.id } });
    const records = await prisma.paymentRecord.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage, take: perPage,
    });

    return {
      data: records,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  /** Get invoice PDF URL from Stripe */
  static async getInvoicePdfUrl(userId: string, paymentRecordId: string) {
    const record = await prisma.paymentRecord.findUnique({ where: { id: paymentRecordId } });
    if (!record || record.userId !== userId) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    if (record.invoicePdf) return record.invoicePdf;

    if (record.gatewayPaymentId && record.gateway === 'STRIPE') {
      const gateway = getGateway();
      const pdfUrl = await gateway.getInvoicePdfUrl(record.gatewayPaymentId);
      if (pdfUrl) {
        await prisma.paymentRecord.update({
          where: { id: paymentRecordId },
          data: { invoicePdf: pdfUrl },
        });
        return pdfUrl;
      }
    }

    return null;
  }

  /** Create a billing portal session */
  static async createPortalSession(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub || !sub.gatewayCustomerId) {
      throw new AppError('No billing customer found', 400, 'NO_CUSTOMER');
    }

    const gateway = getGateway();
    return gateway.createPortalSession(sub.gatewayCustomerId, `${env.APP_URL}/settings?tab=subscription`);
  }

  /**
   * Handle grace period expiration (Rule 6).
   * Called by the daily background job.
   */
  static async handleExpiredGracePeriods() {
    const now = new Date();
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        gracePeriodEnd: { lt: now },
        status: 'PAST_DUE',
      },
      include: { user: true },
    });

    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
    if (!freePlan) return { processed: 0 };

    let processed = 0;
    for (const sub of expiredSubs) {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            planId: freePlan.id, status: 'ACTIVE',
            gracePeriodEnd: null, cancelAtPeriodEnd: false,
            gateway: 'MANUAL', manuallyAssigned: true,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
          },
        });

        const limits = freePlan.limits as any;
        await tx.subscriptionUsage.update({
          where: { userId: sub.userId },
          data: {
            creditsUsed: 0, exportsCount: 0,
            creditsLimit: limits?.creditsPerMonth || 50,
            storageLimitBytes: BigInt((limits?.storageGb || 2) * 1024 * 1024 * 1024),
            exportsLimit: limits?.maxExportsPerMonth || 10,
            projectsLimit: limits?.maxProjects || 5,
            periodStart: now,
            periodEnd: new Date(now.getTime() + 30 * 86400000),
            lastResetAt: now,
          },
        });
      });
      processed++;
    }

    return { processed };
  }
}
