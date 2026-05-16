# PHASE 13 — Frontend: Subscription Flow, Pricing & Checkout
> DirectorByte Rebuild · Depends on: PHASE_12 (Settings Complete)

---

## Objective

Build the complete subscription experience: public pricing page, checkout
flow with promo codes, plan upgrade/downgrade, and cancellation with
retention offer. This must convert well — every friction point counts.

---

## 13.1 — Pricing Page (`/pages/subscription/Pricing/`)

Route: `/pricing` — publicly accessible (no auth required, but shows different CTAs if authenticated).

### Page layout (full page, no app sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│ DirectorByte logo (top left)  [Sign In]  [Get Started] (top right) │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│              Simple, transparent pricing                           │
│           From hobbyist to professional filmmaker                  │
│                                                                    │
│           [Monthly]  ─── ◉ ───  [Annual  Save 17%]               │  ← billing toggle
│                                                                    │
│ ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│ │     FREE      │  │   CREATOR  ⭐ │  │    STUDIO     │          │
│ │    $0/mo      │  │   $19/mo      │  │   $49/mo      │          │
│ │               │  │ ($190/yr)     │  │ ($490/yr)     │          │
│ │  [Get Started]│  │[Start Trial ▶]│  │ [Start Trial] │          │
│ │               │  │               │  │               │          │
│ │ Feature list  │  │ Feature list  │  │ Feature list  │          │
│ └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                    │
│              ─── Full comparison table ───                        │
│              ─── FAQ section ───                                  │
│              ─── Testimonials ───                                 │
└────────────────────────────────────────────────────────────────────┘
```

### Plan Cards

Each card:
```
┌─────────────────────────────────────┐
│ FREE                                │
│ ─────────────────────────────────── │
│ $0                                  │
│ per month · forever                 │
│                                     │
│ [Get Started]  ← if not logged in   │
│ [Current Plan] ← if on this plan    │
│ [Switch Plan]  ← if on another plan │
│                                     │
│ ─── Includes ───────────────────── │
│ ✓  50 AI credits per month         │
│ ✓  2 GB cloud storage              │
│ ✓  5 active projects               │
│ ✓  Script generation               │
│ ✓  Storyboard generation           │
│ ✓  Image generation                │
│ ✓  BYO API keys                    │
│ ✓  Google Drive storage (via OAuth)│
│ ✗  Managed AI keys                 │
│ ✗  Video generation                │
│ ✗  Audio generation                │
│ ✗  Project sharing                 │
│ ✗  Version history                 │
│ ✗  Priority support                │
└─────────────────────────────────────┘
```

Creator card: "MOST POPULAR" badge at top, brand border, slight elevation.
Annual toggle: shows /yr price crossed out, annual price, "Save $38/yr" badge.

### Comparison Table
Full feature-by-feature matrix (collapsible on mobile):

```
Feature                      Free    Creator  Studio
─────────────────────────────────────────────────────
AI Credits / month            50      500      2,000
Cloud Storage                  2GB     20GB     100GB
Active Projects                5       ∞        ∞
Exports / month               10      100        ∞
─────────────────────────────────────────────────────
STUDIO MODULES
Script Generation              ✓        ✓        ✓
Storyboard                     ✓        ✓        ✓
Image Generation               ✓        ✓        ✓
Video Generation               ✗        ✓        ✓
Audio Generation               ✗        ✓        ✓
Voice-over                     ✗        ✓        ✓
Final Assembly                 ✗        ✓        ✓
─────────────────────────────────────────────────────
AI KEYS
Managed AI Keys               ✗        ✓        ✓
BYO API Keys                  ✓        ✓        ✓
─────────────────────────────────────────────────────
FEATURES
Project Sharing               ✗        ✓        ✓
Version History               ✗        ✓        ✓
No Watermark                  ✗        ✗        ✓
Priority Support              ✗        ✗        ✓
API Access                    ✗        ✗        ✓
─────────────────────────────────────────────────────
```

### FAQ Section (from admin CMS)
Accordion-style Q&A.

### Testimonials Strip
3 testimonials: avatar, name, quote, star rating.

---

## 13.2 — Checkout Flow (`/pages/subscription/Checkout/`)

Route: `/checkout?plan=creator&cycle=annual`

### Checkout Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Pricing                                        │
│                                                          │
│  Complete your subscription                              │
│                                                          │
│ ┌────────────────────────────────┐ ┌──────────────────┐ │
│ │  Step 1 of 2: Review & Promo   │ │  ORDER SUMMARY   │ │
│ │                                │ │                  │ │
│ │  [Promo code input + Apply]    │ │  Creator Plan    │ │
│ │                                │ │  Annual billing  │ │
│ │  [Continue to Payment →]       │ │  ─────────────── │ │
│ │                                │ │  $190.00/yr      │ │
│ │                                │ │  Save $38        │ │
│ │                                │ │  vs. monthly     │ │
│ │                                │ │  ─────────────── │ │
│ │                                │ │  Total: $190.00  │ │
│ │                                │ │                  │ │
│ │                                │ │  ✓ 7-day trial  │ │
│ │                                │ │  Cancel anytime  │ │
│ └────────────────────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Step 1: Review & Promo Code

```
Promo Code (optional)
┌─────────────────────────────────────────────────────────┐
│ [ENTER_PROMO_CODE                ] [Apply]              │
└─────────────────────────────────────────────────────────┘

If promo code applied and valid:
┌─────────────────────────────────────────────────────────┐
│ ✅ Promo code SAVE30 applied — 30% off                  │
│    Original: $190.00  You pay: $133.00                  │
│                                      [Remove ×]        │
└─────────────────────────────────────────────────────────┘

Order summary updates in real-time with discount reflected.

If price is $0.00 after promo:
┌─────────────────────────────────────────────────────────┐
│ 🎉 Your promo brings this plan to $0.00!               │
│    No payment info required.                            │
└─────────────────────────────────────────────────────────┘
→ Skip to confirmation step, no payment gateway redirect

[Continue to Payment →]  ← only if price > $0
[Activate Free Plan →]   ← if price = $0
```

### Step 2: Payment
If price > $0: redirect user to payment gateway (Stripe Checkout, Razorpay, etc.)
The gateway handles the actual payment form.
On gateway success: gateway redirects to `/checkout/success?session_id=...`

### Success Page (`/pages/subscription/CheckoutSuccess/`)
Route: `/checkout/success`

```
[Checkmark animation — large, animated]

🎬 You're on Creator Plan!

Your subscription is now active.
Next billing: June 1, 2025 ($19.00)

What you unlocked:
✓ 500 AI credits this month
✓ 20 GB storage
✓ All studio modules
✓ Managed AI keys — no setup needed!

[Start Creating →]  ← navigates to /home
```

Auto-redirect to /home after 5 seconds (with countdown).
Confetti burst on load (subtle, brand colors).

### Failure Page (`/pages/subscription/CheckoutFailed/`)
```
[X icon animation]
Payment Unsuccessful

"Something went wrong with your payment.
No charges have been made."

Error: [error message from gateway if available]

[Try again]         ← re-initiates checkout
[Use a different card]
[Contact support]
```

---

## 13.3 — Plan Upgrade Flow

Triggered from: Settings → Subscription → "Upgrade to Studio", or from usage warning.

### Upgrade Modal (in-app, no new page)
```
┌────────────────────────────────────────────────────────┐
│ Upgrade to Studio Plan                            [×] │
├────────────────────────────────────────────────────────┤
│ You're currently on Creator ($19/month)                │
│                                                        │
│ Upgrading to Studio ($49/month):                       │
│ ✓ No watermark on exports                             │
│ ✓ 2,000 AI credits/month (vs 500)                    │
│ ✓ 100 GB storage (vs 20 GB)                           │
│ ✓ Unlimited exports                                   │
│ ✓ Priority support                                    │
│                                                        │
│ Billing:                                               │
│ Prorated charge today: $18.67 (23 days remaining)     │
│ Then: $49/month from June 1, 2025                     │
│                                                        │
│ Payment method: Visa •••• 4242                        │
│                                                        │
│ [Cancel]    [Upgrade Now — $18.67]                   │
└────────────────────────────────────────────────────────┘
```

On success: toast "Upgraded to Studio Plan! 🎉" + update plan badge everywhere.

---

## 13.4 — Plan Downgrade Flow

Triggered from: Settings → Subscription → "Switch to Creator".

### Downgrade Modal
```
┌────────────────────────────────────────────────────────┐
│ Switch to Creator Plan                            [×] │
├────────────────────────────────────────────────────────┤
│ You're currently on Studio ($49/month)                 │
│                                                        │
│ Switching to Creator ($19/month):                      │
│                                                        │
│ ⚠️  You'll lose:                                       │
│ ✗ Watermark-free exports (watermark re-added)         │
│ ✗ 1,500 credits/month (drops to 500)                  │
│ ✗ 80 GB storage (new limit 20 GB)                     │
│ ✗ Priority support                                    │
│                                                        │
│ Your current storage is 8.2 GB — within the 20 GB    │
│ Creator limit. No action needed.                       │
│                                                        │
│ Change takes effect: June 1, 2025 (next billing date) │
│ You keep Studio access until then.                    │
│                                                        │
│ [Keep Studio]    [Switch to Creator]                  │
└────────────────────────────────────────────────────────┘
```

If current usage exceeds new plan limits (storage > 20GB):
```
⚠️ Warning: Storage over new limit
Your current storage (42 GB) exceeds the Creator plan limit (20 GB).
You have 30 days after the switch to reduce storage below 20 GB,
after which uploads will be blocked until you free up space.
```

---

## 13.5 — Cancellation Flow

Triggered from: Settings → Subscription → "Cancel Subscription".

### Step 1: Cancellation Reason Modal
```
┌────────────────────────────────────────────────────────┐
│ We're sorry to see you go 😔                     [×] │
├────────────────────────────────────────────────────────┤
│ Why are you canceling?                                 │
│                                                        │
│ ○ Too expensive                                        │
│ ○ Not using it enough                                  │
│ ○ Missing features I need                              │
│ ○ Found a better alternative                           │
│ ○ Technical issues                                     │
│ ○ Temporary break / will return                       │
│ ○ Other                                                │
│                                                        │
│ [Optional] Tell us more:                              │
│ [textarea, 3 rows]                                    │
│                                                        │
│ [Back]    [Continue →]                                │
└────────────────────────────────────────────────────────┘
```

### Step 2: Retention Offer
(Based on cancellation reason — show tailored offer.)

```
┌────────────────────────────────────────────────────────┐
│ Wait! Here's a special offer for you 🎁          [×] │
├────────────────────────────────────────────────────────┤
│ Since you selected "Too expensive"...                  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │  🎉 Stay for 50% off next month                 │   │
│ │     Only $9.50 for your next billing cycle      │   │
│ │     Full Creator plan access, no restrictions   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ [Claim 50% off →]    [No thanks, cancel anyway]       │
└────────────────────────────────────────────────────────┘
```

Retention offer options (admin configures which to show per reason):
- Price: "50% off next month"
- Not using: "Pause subscription for 1 month"
- Missing features: "Here's what's coming next month..."
- Technical: "Let our team help you directly [Contact support]"

### Step 3: Confirmation
If user ignores offer and confirms cancel:
```
┌────────────────────────────────────────────────────────┐
│ Confirm Cancellation                              [×] │
├────────────────────────────────────────────────────────┤
│ Your subscription will be canceled.                   │
│                                                        │
│ You'll keep full Creator access until:                │
│ May 31, 2025                                          │
│                                                        │
│ After that:                                           │
│ • Downgraded to Free plan                             │
│ • 50 credits/month (was 500)                          │
│ • No access to Video/Audio/Assembly stages            │
│ • Projects remain, but new ones limited to 5         │
│                                                        │
│ [Keep My Subscription]  [Yes, Cancel]                │
└────────────────────────────────────────────────────────┘
```

On cancel success: toast "Subscription canceled. Access until May 31."
Update plan status everywhere.

---

## 13.6 — Usage Warning Banner

When AI credits reach 80%:
```
┌────────────────────────────────────────────────────────────────────┐
│ ⚠️  You've used 80% of your AI credits this month (400/500).      │
│    Upgrade to get 2,000 credits and never run out.  [Upgrade]  [×]│
└────────────────────────────────────────────────────────────────────┘
```

When credits reach 100%:
```
┌────────────────────────────────────────────────────────────────────┐
│ 🚫  You've used all your AI credits for this month.               │
│    Upgrade now to continue generating. Credits reset May 31.       │
│    [Upgrade Plan →]                                               │
└────────────────────────────────────────────────────────────────────┘
```

This banner appears at the top of every page (below topbar) until dismissed or resolved.
Cannot dismiss the 100% version — only upgrade resolves it.

---

## 13.7 — Free Plan Prompts

Throughout the app, if a feature is unavailable on Free plan:
- Module is shown but with a lock icon
- Clicking locked feature: shows upgrade prompt tooltip
- Upgrade prompt links to `/pricing`

```
Example: User clicks Video Generation on Free plan

┌───────────────────────────────────────────────────────┐
│ 🔒 Video Generation                                   │
│                                              [×]      │
│ Video generation is available on Creator and          │
│ Studio plans.                                         │
│                                                       │
│ ✓ 500 AI credits/month                               │
│ ✓ All studio modules                                  │
│ ✓ Managed API keys                                   │
│                                                       │
│ [See Plans →]   [Start Free Trial]                   │
└───────────────────────────────────────────────────────┘
```

---

## 13.8 — Completion Criteria

- [ ] Pricing page renders with correct plan data from API
- [ ] Monthly/Annual toggle updates prices and saves badges correctly
- [ ] All three plan cards show correct features and CTAs
- [ ] Comparison table is complete and accurate
- [ ] FAQ accordion works
- [ ] Authenticated users see correct CTA (Current Plan vs Upgrade vs Start Trial)
- [ ] Checkout page loads with plan/cycle from URL params
- [ ] Promo code input validates against API and shows discount
- [ ] $0 checkout skips payment gateway, activates immediately
- [ ] Payment gateway redirect works and success page handles callback
- [ ] Success page shows correct plan details and auto-redirect
- [ ] Failure page shows error and retry option
- [ ] Upgrade modal shows prorated charge calculation
- [ ] Upgrade completes and updates plan everywhere in app
- [ ] Downgrade modal shows features lost and warns on storage overage
- [ ] Downgrade deferred to next billing date
- [ ] Cancellation reason modal saves reason to backend
- [ ] Retention offer shows tailored to selected reason
- [ ] Claiming retention offer applies discount and cancels cancellation
- [ ] Cancellation confirmation shows correct access-until date
- [ ] Credit usage warning banner appears at 80% (dismissible)
- [ ] Credit exhaustion banner appears at 100% (non-dismissible)
- [ ] Locked feature prompts show correctly on Free plan
- [ ] Zero TypeScript errors
