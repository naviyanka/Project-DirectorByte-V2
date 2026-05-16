/**
 * Razorpay Payment Gateway Implementation
 * -----------------------------------------
 * Implements the PaymentGateway interface using the Razorpay SDK.
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import {
  PaymentGateway,
  CheckoutParams,
  CheckoutSession,
  ExternalSubscription,
  UpdateParams,
  WebhookEvent,
} from './gateway.interface';

let razorpayInstance: InstanceType<typeof Razorpay> | null = null;

function getRazorpay(): InstanceType<typeof Razorpay> {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

export class RazorpayGateway implements PaymentGateway {
  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    const rz = getRazorpay();

    // Razorpay uses subscriptions API for recurring
    const plan = await (rz.plans as any).create({
      period: params.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly',
      interval: 1,
      item: {
        name: params.planName,
        amount: params.amount, // in paise (smallest currency unit)
        currency: params.currency.toUpperCase(),
      },
    });

    const subscription = await (rz.subscriptions as any).create({
      plan_id: plan.id,
      total_count: params.billingCycle === 'MONTHLY' ? 12 : 1,
      notes: {
        userId: params.userId,
        planId: params.planId,
      },
    });

    return {
      sessionId: subscription.id,
      checkoutUrl: subscription.short_url || '',
    };
  }

  async cancelSubscription(externalId: string, _immediately: boolean): Promise<void> {
    const rz = getRazorpay();
    await (rz.subscriptions as any).cancel(externalId);
  }

  async updateSubscription(externalId: string, params: UpdateParams): Promise<void> {
    const rz = getRazorpay();
    const updateData: any = {};
    if (params.priceId) updateData.plan_id = params.priceId;
    await (rz.subscriptions as any).update(externalId, updateData);
  }

  async getSubscription(externalId: string): Promise<ExternalSubscription> {
    const rz = getRazorpay();
    const sub = await (rz.subscriptions as any).fetch(externalId);

    return {
      id: sub.id,
      status: sub.status,
      currentPeriodStart: new Date((sub.current_start || 0) * 1000),
      currentPeriodEnd: new Date((sub.current_end || 0) * 1000),
      cancelAtPeriodEnd: sub.status === 'cancelled',
      canceledAt: sub.ended_at ? new Date(sub.ended_at * 1000) : undefined,
    };
  }

  async createCoupon(_params: {
    id?: string; percentOff?: number; amountOff?: number;
    currency?: string; duration: 'once' | 'forever' | 'repeating';
  }): Promise<string> {
    // Razorpay offers are more limited; return a placeholder
    return `rz_coupon_${Date.now()}`;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ portalUrl: string }> {
    // Razorpay doesn't have a direct equivalent to Stripe's customer portal in the same way.
    // Typically, you provide a hosted link or handle it via API.
    // Returning a dummy or throwing an error is standard if unsupported.
    return { portalUrl: returnUrl };
  }

  async getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
    const rz = getRazorpay();
    try {
      const invoice = await (rz.invoices as any).fetch(invoiceId);
      return invoice.short_url || null;
    } catch {
      return null;
    }
  }

  validateWebhook(payload: string | Buffer, signature: string): WebhookEvent {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');
    }

    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(typeof payload === 'string' ? payload : payload.toString('utf8'))
      .digest('hex');

    if (expectedSig !== signature) {
      throw new Error('Invalid Razorpay webhook signature');
    }

    const body = JSON.parse(typeof payload === 'string' ? payload : payload.toString('utf8'));

    return {
      type: body.event,
      data: body.payload,
      rawEvent: body,
    };
  }
}
