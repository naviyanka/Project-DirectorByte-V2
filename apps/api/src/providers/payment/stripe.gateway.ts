/**
 * Stripe Payment Gateway Implementation
 * ----------------------------------------
 * Implements the PaymentGateway interface using the Stripe SDK.
 */
import Stripe from 'stripe';
import { getEnv } from '../../config/env';
import {
  PaymentGateway,
  CheckoutParams,
  CheckoutSession,
  ExternalSubscription,
  UpdateParams,
  WebhookEvent,
} from './gateway.interface';

let stripeInstance: any = null;

function getStripe(): any {
  if (!stripeInstance) {
    if (!(getEnv().STRIPE_SECRET_KEY || "")) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe((getEnv().STRIPE_SECRET_KEY || ""));
  }
  return stripeInstance;
}

export class StripeGateway implements PaymentGateway {
  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    const stripe = getStripe();

    const sessionParams: any = {
      mode: 'subscription',
      customer_email: params.customerEmail,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId, planId: params.planId,
        billingCycle: params.billingCycle, ...params.metadata,
      },
      subscription_data: {
        metadata: { userId: params.userId, planId: params.planId },
      },
    };

    if (params.trialDays && params.trialDays > 0) {
      sessionParams.subscription_data.trial_period_days = params.trialDays;
    }
    if (params.couponId) {
      sessionParams.discounts = [{ coupon: params.couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { sessionId: session.id, checkoutUrl: session.url || '' };
  }

  async cancelSubscription(externalId: string, immediately: boolean): Promise<void> {
    const stripe = getStripe();
    if (immediately) {
      await stripe.subscriptions.cancel(externalId);
    } else {
      await stripe.subscriptions.update(externalId, { cancel_at_period_end: true });
    }
  }

  async updateSubscription(externalId: string, params: UpdateParams): Promise<void> {
    const stripe = getStripe();
    const updateParams: any = {};

    if (params.priceId) {
      const sub = await stripe.subscriptions.retrieve(externalId);
      const currentItem = sub.items.data[0];
      if (currentItem) {
        updateParams.items = [{ id: currentItem.id, price: params.priceId }];
      }
    }
    if (params.prorationBehavior) updateParams.proration_behavior = params.prorationBehavior;
    if (params.couponId) updateParams.coupon = params.couponId;

    await stripe.subscriptions.update(externalId, updateParams);
  }

  async getSubscription(externalId: string): Promise<ExternalSubscription> {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(externalId);
    return {
      id: sub.id, status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : undefined,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
    };
  }

  async createCoupon(params: {
    id?: string; percentOff?: number; amountOff?: number;
    currency?: string; duration: 'once' | 'forever' | 'repeating';
    durationInMonths?: number;
  }): Promise<string> {
    const stripe = getStripe();
    const couponParams: any = { duration: params.duration };
    if (params.id) couponParams.id = params.id;
    if (params.percentOff) couponParams.percent_off = params.percentOff;
    if (params.amountOff) couponParams.amount_off = params.amountOff;
    if (params.currency) couponParams.currency = params.currency;
    if (params.durationInMonths) couponParams.duration_in_months = params.durationInMonths;
    const coupon = await stripe.coupons.create(couponParams);
    return coupon.id;
  }

  async getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
    const stripe = getStripe();
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.invoice_pdf || null;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ portalUrl: string }> {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { portalUrl: session.url };
  }

  validateWebhook(payload: string | Buffer, signature: string): WebhookEvent {
    const stripe = getStripe();
    if (!(getEnv().STRIPE_WEBHOOK_SECRET || "")) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    const event = stripe.webhooks.constructEvent(payload, signature, (getEnv().STRIPE_WEBHOOK_SECRET || ""));
    return { type: event.type, data: event.data.object as Record<string, any>, rawEvent: event };
  }
}
