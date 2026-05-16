/**
 * Webhook Controller
 * -------------------
 * Handles Stripe webhook events with signature verification.
 * This endpoint must receive the raw body (not parsed JSON).
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { StripeGateway } from '../providers/payment/stripe.gateway';
import { UsageService } from '../services/usage.service';
import { logger } from '../config/logger';
import { Decimal } from '@prisma/client/runtime/library';

const GRACE_PERIOD_DAYS = 7;

export class WebhookController {
  static async handleStripe(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) return res.status(400).json({ error: 'Missing stripe-signature header' });

      const gateway = new StripeGateway();
      const event = gateway.validateWebhook(req.body, signature);

      logger.info({ type: event.type }, 'Stripe webhook received');

      switch (event.type) {
        case 'checkout.session.completed':
          await WebhookController.onCheckoutCompleted(event.data);
          break;
        case 'invoice.paid':
          await WebhookController.onInvoicePaid(event.data);
          break;
        case 'invoice.payment_failed':
          await WebhookController.onPaymentFailed(event.data);
          break;
        case 'customer.subscription.updated':
          await WebhookController.onSubscriptionUpdated(event.data);
          break;
        case 'customer.subscription.deleted':
          await WebhookController.onSubscriptionDeleted(event.data);
          break;
        case 'customer.subscription.trial_will_end':
          await WebhookController.onTrialWillEnd(event.data);
          break;
        default:
          logger.info({ type: event.type }, 'Unhandled webhook event');
      }

      return res.json({ received: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Webhook processing error');
      return res.status(400).json({ error: error.message });
    }
  }

  /** checkout.session.completed → Activate subscription */
  private static async onCheckoutCompleted(data: Record<string, any>) {
    const userId = data.metadata?.userId;
    const planId = data.metadata?.planId;
    if (!userId || !planId) return;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return;

    const subId = data.subscription as string;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 86400000);

    await prisma.$transaction(async (tx: any) => {
      // Upsert subscription
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId, planId, status: 'ACTIVE', billingCycle: 'MONTHLY',
          gateway: 'STRIPE', gatewaySubscriptionId: subId,
          currentPeriodStart: now, currentPeriodEnd: periodEnd,
        },
        update: {
          planId, status: 'ACTIVE', gatewaySubscriptionId: subId,
          currentPeriodStart: now, currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false, canceledAt: null, gracePeriodEnd: null,
        },
      });

      const sub = await tx.subscription.findUnique({ where: { userId } });

      // Create payment record
      await tx.paymentRecord.create({
        data: {
          subscriptionId: sub!.id, userId, gateway: 'STRIPE',
          gatewayPaymentId: data.payment_intent as string || data.id,
          amount: new Decimal((data.amount_total || 0) / 100),
          currency: (data.currency as string || 'usd').toUpperCase(),
          status: 'SUCCEEDED', paidAt: now,
        },
      });

      // Reset usage
      const limits = plan.limits as any;
      await tx.subscriptionUsage.upsert({
        where: { userId },
        create: {
          subscriptionId: sub!.id, userId,
          creditsLimit: limits?.creditsPerMonth || 50,
          storageLimitBytes: BigInt((limits?.storageGb || 2) * 1073741824),
          exportsLimit: limits?.maxExportsPerMonth || 10,
          projectsLimit: limits?.maxProjects || 5,
          periodStart: now, periodEnd,
        },
        update: {
          creditsUsed: 0, exportsCount: 0,
          creditsLimit: limits?.creditsPerMonth || 50,
          storageLimitBytes: BigInt((limits?.storageGb || 2) * 1073741824),
          exportsLimit: limits?.maxExportsPerMonth || 10,
          projectsLimit: limits?.maxProjects || 5,
          periodStart: now, periodEnd, lastResetAt: now,
        },
      });
    });
  }

  /** invoice.paid → Update period, create payment record, reset usage */
  private static async onInvoicePaid(data: Record<string, any>) {
    const subId = data.subscription as string;
    if (!subId) return;

    const sub = await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: subId } });
    if (!sub) return;

    const periodStart = data.period_start ? new Date(data.period_start * 1000) : new Date();
    const periodEnd = data.period_end ? new Date(data.period_end * 1000) : new Date(Date.now() + 30 * 86400000);

    await prisma.$transaction(async (tx: any) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, status: 'ACTIVE', gracePeriodEnd: null },
      });

      await tx.paymentRecord.create({
        data: {
          subscriptionId: sub.id, userId: sub.userId, gateway: 'STRIPE',
          gatewayPaymentId: data.payment_intent as string || data.id,
          amount: new Decimal((data.amount_paid || 0) / 100),
          currency: (data.currency as string || 'usd').toUpperCase(),
          status: 'SUCCEEDED', paidAt: new Date(),
          invoiceUrl: data.hosted_invoice_url || null,
          invoicePdf: data.invoice_pdf || null,
        },
      });

      await UsageService.resetUsageForPeriod(sub.userId, periodStart, periodEnd);
    });
  }

  /** invoice.payment_failed → Set PAST_DUE + grace period */
  private static async onPaymentFailed(data: Record<string, any>) {
    const subId = data.subscription as string;
    if (!subId) return;

    const sub = await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: subId } });
    if (!sub) return;

    const gracePeriodEnd = new Date(Date.now() + GRACE_PERIOD_DAYS * 86400000);

    await prisma.$transaction(async (tx: any) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE', gracePeriodEnd },
      });

      await tx.paymentRecord.create({
        data: {
          subscriptionId: sub.id, userId: sub.userId, gateway: 'STRIPE',
          gatewayPaymentId: data.payment_intent as string || data.id,
          amount: new Decimal((data.amount_due || 0) / 100),
          currency: (data.currency as string || 'usd').toUpperCase(),
          status: 'FAILED', failedAt: new Date(),
        },
      });
    });
  }

  /** customer.subscription.updated → Sync status and flags */
  private static async onSubscriptionUpdated(data: Record<string, any>) {
    const subId = data.id as string;
    const sub = await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: subId } });
    if (!sub) return;

    const statusMap: Record<string, string> = {
      active: 'ACTIVE', trialing: 'TRIALING', past_due: 'PAST_DUE',
      canceled: 'CANCELED', unpaid: 'PAST_DUE',
    };

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: (statusMap[data.status] || sub.status) as any,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? sub.cancelAtPeriodEnd,
        currentPeriodStart: data.current_period_start ? new Date(data.current_period_start * 1000) : undefined,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end * 1000) : undefined,
      },
    });
  }

  /** customer.subscription.deleted → Mark as CANCELED */
  private static async onSubscriptionDeleted(data: Record<string, any>) {
    const subId = data.id as string;
    const sub = await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: subId } });
    if (!sub) return;

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });
  }

  /** customer.subscription.trial_will_end → Log (email would be sent) */
  private static async onTrialWillEnd(data: Record<string, any>) {
    const subId = data.id as string;
    logger.info({ subscriptionId: subId }, 'Trial ending in 3 days — email would be sent');
  }
}
