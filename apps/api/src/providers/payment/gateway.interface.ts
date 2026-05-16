/**
 * Payment Gateway Abstraction Layer
 * ----------------------------------
 * Defines a common interface for all payment providers (Stripe, Paddle, Razorpay).
 * This makes it trivial to swap or add payment gateways without changing business logic.
 */

export interface CheckoutParams {
  userId: string;
  planId: string;
  planName: string;
  priceId: string;             // External price ID on the gateway (e.g., Stripe price_xxx)
  billingCycle: 'MONTHLY' | 'ANNUAL';
  amount: number;              // Final amount in cents
  currency: string;
  customerEmail: string;
  trialDays?: number;
  couponId?: string;           // External coupon ID on the gateway
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

export interface SubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  couponId?: string;
  metadata?: Record<string, string>;
}

export interface ExternalSubscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface UpdateParams {
  priceId?: string;
  couponId?: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface WebhookEvent {
  type: string;
  data: Record<string, any>;
  rawEvent: any;
}

export interface PaymentGateway {
  /** Create a hosted checkout session for a new subscription */
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;

  /** Cancel an external subscription */
  cancelSubscription(externalId: string, immediately: boolean): Promise<void>;

  /** Update an external subscription (e.g., change price/plan) */
  updateSubscription(externalId: string, params: UpdateParams): Promise<void>;

  /** Get subscription details from the gateway */
  getSubscription(externalId: string): Promise<ExternalSubscription>;

  /** Create a coupon/discount on the gateway */
  createCoupon(params: {
    id?: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: 'once' | 'forever' | 'repeating';
    durationInMonths?: number;
  }): Promise<string>;  // returns coupon ID

  /** Get the invoice PDF URL for a payment */
  getInvoicePdfUrl(invoiceId: string): Promise<string | null>;

  /** Create a hosted customer portal session */
  createPortalSession(customerId: string, returnUrl: string): Promise<{ portalUrl: string }>;

  /** Validate and parse a webhook event */
  validateWebhook(payload: string | Buffer, signature: string): WebhookEvent;
}
