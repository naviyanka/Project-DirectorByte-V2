# PHASE 05 — Backend: Subscriptions, Plans, Promo Codes & Payments
> DirectorByte Rebuild · Depends on: PHASE_04 Users & Projects

---

## Objective

Build the complete monetization backend: plan management, subscription
lifecycle, promo code system, payment gateway integration, and webhooks.
Architecture must make it trivial to swap or add payment gateways.

---

## 5.1 — Plan Routes (Public + Authenticated)

**GET /api/v1/plans** (public)
- Returns all plans where `isActive=true AND isPublic=true`
- Ordered by `sortOrder ASC`
- Includes plan limits and features
- Used by pricing page and checkout flow

**GET /api/v1/plans/:slug** (public)
- Single plan by slug
- Returns full plan detail

(Plan modification is admin-only — see Phase 06)

---

## 5.2 — Subscription Routes (`/api/v1/subscriptions/`)

All routes require authentication.

**GET /api/v1/subscriptions/me**
- Returns user's full subscription detail:
```json
{
  "id", "status", "billingCycle",
  "plan": { "id", "name", "slug", "priceMonthly", "priceAnnual", "features", "limits" },
  "currentPeriodStart", "currentPeriodEnd",
  "cancelAtPeriodEnd", "canceledAt",
  "trialStart", "trialEnd",
  "promoCode": { "code", "discountType", "discountValue" },
  "usage": {
    "creditsUsed", "creditsLimit", "creditsPercent",
    "storageUsedBytes", "storageLimitBytes", "storagePercent",
    "exportsCount", "exportsLimit",
    "projectsCount", "projectsLimit",
    "periodStart", "periodEnd", "lastResetAt"
  },
  "paymentHistory": [{ "id", "amount", "currency", "status", "paidAt", "invoiceUrl" }]
}
```

**POST /api/v1/subscriptions/checkout**
- Body: `{ planId, billingCycle: "monthly"|"annual", promoCode? }`
- Validate plan exists and is active
- Validate promo code if provided (see 5.3)
- Calculate final price after discount
- If final price == 0:
  - Create subscription immediately (no payment gateway call)
  - Set payment record with status=WAIVED
  - Return: `{ success: true, subscription }`
- If final price > 0:
  - Call payment gateway to create checkout session
  - Return: `{ checkoutUrl: string }` (redirect user to gateway)
- Handle plan change (upgrade/downgrade) if already subscribed

**POST /api/v1/subscriptions/cancel**
- Body: `{ immediately?: bool, reason?: string }`
- If immediately=false (default): set cancelAtPeriodEnd=true
- If immediately=true: cancel now, calculate prorated refund if policy allows
- Send cancellation email
- Return: `{ success: true, accessUntil: date }`

**POST /api/v1/subscriptions/reactivate**
- If subscription is canceled but still in grace period:
  - Clear cancelAtPeriodEnd flag
  - Resume normally
- If expired: redirect to checkout
- Return: updated subscription

**POST /api/v1/subscriptions/change-billing-cycle**
- Body: `{ billingCycle: "monthly"|"annual" }`
- Calculate price difference
- Apply change at next renewal
- Return: `{ success: true, nextAmount, nextRenewalDate }`

**POST /api/v1/subscriptions/apply-promo**
- Body: `{ code }`
- Validate code (see 5.3)
- Apply discount to current subscription if applicable
- Return: `{ discount, newAmount }`

**GET /api/v1/subscriptions/invoices**
- Query: `{ page?, perPage? }`
- Returns paginated list of payment records with invoice URLs

**GET /api/v1/subscriptions/invoices/:id/pdf**
- Generate or retrieve invoice PDF
- Return PDF file stream

---

## 5.3 — Promo Code Service (`/services/promo.service.ts`)

The promo code service handles all validation and redemption logic.

### validatePromoCode(code, userId, planId, billingCycle)
Returns: `{ valid: bool, error?: string, discount }` where discount is:
```typescript
{
  type: "PERCENT" | "FIXED" | "TRIAL_DAYS" | "FREE_UPGRADE",
  value: number,
  finalPrice: number,    // calculated after discount
  displayText: string    // "30% off" / "$10 off" / "7 days free"
}
```

Validation checks (all must pass):
1. Code exists and `isActive = true`
2. Current date within `startsAt` and `expiresAt` (if set)
3. `maxTotalRedemptions == 0` OR `currentRedemptions < maxTotalRedemptions`
4. User has not already used this code (`maxPerUser` check via PromoRedemption)
5. If `firstTimeOnly`: user has never had a paid subscription
6. If `appliesToPlanIds` not empty: planId must be in the list

### redeemPromoCode(code, userId, subscriptionId)
- Create PromoRedemption record
- Increment `currentRedemptions` on PromoCode
- Atomically (transaction)

### calculateDiscountedPrice(plan, billingCycle, discount)
- Returns final price after applying discount
- Never goes below $0
- For TRIAL_DAYS: extends trial period rather than reducing price
- For FREE_UPGRADE: switches plan to a different plan for N days

---

## 5.4 — Payment Gateway Abstraction

### Gateway Interface (`/providers/payment/gateway.interface.ts`)
```typescript
interface PaymentGateway {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>
  createSubscription(params: SubscriptionParams): Promise<ExternalSubscription>
  cancelSubscription(externalId: string, immediately: bool): Promise<void>
  updateSubscription(externalId: string, params: UpdateParams): Promise<void>
  getSubscription(externalId: string): Promise<ExternalSubscription>
  generateInvoicePdf(paymentId: string): Promise<Buffer>
  validateWebhook(payload: string, signature: string): WebhookEvent
}
```

### Stripe Implementation (`/providers/payment/stripe.gateway.ts`)

Implement all interface methods for Stripe:
- `createCheckoutSession`: creates Stripe Checkout Session with correct price IDs
- Handle both monthly and annual price IDs per plan
- Apply coupons for promo codes (create Stripe coupon if discount type is PERCENT or FIXED)
- Set trial period for TRIAL_DAYS discount
- Return hosted checkout URL

### Webhook Handler (`/routes/webhook.routes.ts`)

**POST /api/v1/webhooks/stripe** (no auth — verified by signature)
```typescript
// Verify Stripe-Signature header using STRIPE_WEBHOOK_SECRET
// Handle events:

"checkout.session.completed" →
  - Find subscription by metadata.userId
  - Activate subscription
  - Create PaymentRecord with status=SUCCEEDED
  - Reset usage counters for new period
  - Send subscription-confirmation email

"invoice.paid" →
  - Update subscription period dates
  - Create PaymentRecord
  - Reset usage for new period
  - Send invoice email

"invoice.payment_failed" →
  - Update subscription status to PAST_DUE
  - Create PaymentRecord with status=FAILED
  - Send payment-failed email
  - Set grace period end date

"customer.subscription.updated" →
  - Sync subscription status, period, cancel flags

"customer.subscription.deleted" →
  - Set status=CANCELED
  - Set canceledAt
  - Send cancellation email

"customer.subscription.trial_will_end" →
  - Send trial ending reminder email (3 days before)
```

---

## 5.5 — Usage Tracking Service

Usage must be tracked for every billable action.

### decrementCredits(userId, amount, module)
- Check SubscriptionUsage.creditsUsed + amount <= creditsLimit
- If over limit: throw `QuotaExceededError` with helpful message
- Atomically increment creditsUsed
- If after decrement usage is at 80% or 100%: enqueue usage-warning email

### incrementExports(userId)
- Same pattern as credits
- Check exportsCount < exportsLimit

### checkProjectLimit(userId)
- Check projectsCount < projectsLimit (or -1 for unlimited)

### resetUsageForPeriod(userId)
- Called by webhook when new billing period starts
- Reset all counters to 0
- Set periodStart/periodEnd to new values
- Update lastResetAt

### getUsageSummary(userId)
- Returns all usage meters with percentages
- Used by subscription page and admin user view

---

## 5.6 — Subscription Lifecycle Rules

Document these as comments in the service, and implement each:

1. **New signup**: Free plan assigned immediately on registration
2. **Upgrade**: Take effect immediately. Charge prorated amount for remainder of period.
3. **Downgrade**: Take effect at next billing period. Keep current access until period ends.
4. **Cancel**: By default, access until period ends. Immediately cancel requires explicit flag.
5. **Grace period**: On payment failure, set gracePeriodEnd = now + N days. Features stay active.
6. **Grace period end**: Downgrade to Free plan automatically (background job checks daily).
7. **Reactivation**: Within grace period — charge immediately, restore. After — full new checkout.
8. **Plan deleted by admin**: Existing subscribers keep their plan (grandfathered). 
   New signups cannot choose it (isPublic=false).
9. **Promo price = $0**: No payment method collected. Subscription still created normally.
10. **Trial end**: Send email 3 days before. If no payment method, downgrade to Free.

---

## 5.7 — Completion Criteria

- [ ] GET /api/v1/plans returns active public plans correctly
- [ ] Promo code validation handles all edge cases
- [ ] $0 checkout skips payment gateway entirely
- [ ] Stripe checkout flow creates session and returns URL
- [ ] All Stripe webhook events handled and subscription table stays in sync
- [ ] Usage decrement is atomic and respects limits
- [ ] Downgrade/upgrade correctly sets timing (immediate vs next period)
- [ ] Invoice PDF generation works
- [ ] Cancellation flow works with retention logic
- [ ] Background job daily check handles grace period expirations
- [ ] Zero TypeScript errors
