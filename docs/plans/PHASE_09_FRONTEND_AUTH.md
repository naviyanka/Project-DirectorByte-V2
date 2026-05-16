# PHASE 09 — Frontend: Authentication & Onboarding
> DirectorByte Rebuild · Depends on: PHASE_08 (Design System Complete)

---

## Objective

Build the complete authentication experience: sign in, sign up, Google OAuth,
email verification, password reset, and the post-signup onboarding flow.
This is the first thing every user sees — it must feel premium and trustworthy.

All pages use `AuthLayout` from Phase 08. All API calls use the service layer
from `/services/auth.service.ts`. All state goes through `auth.store.ts`.

---

## 9.1 — Auth Service Layer (`/services/auth.service.ts`)

Before building pages, build the service that all auth pages will call.
This isolates API call logic from UI components.

```typescript
// All functions return typed responses or throw typed errors

registerUser(data: RegisterPayload): Promise<{ message: string }>
loginUser(data: LoginPayload): Promise<AuthResponse>
refreshToken(refreshToken: string): Promise<{ accessToken: string }>
logoutUser(): Promise<void>
logoutAllSessions(): Promise<void>

forgotPassword(email: string): Promise<{ message: string }>
resetPassword(token: string, newPassword: string): Promise<void>

verifyEmail(token: string): Promise<void>
resendVerification(email: string): Promise<{ message: string }>

getGoogleAuthUrl(): string   // constructs OAuth redirect URL
handleGoogleCallback(code: string): Promise<AuthResponse>
```

Token storage strategy:
- `accessToken`: memory only (Zustand store) — never localStorage
- `refreshToken`: HttpOnly cookie (set by server) — never readable by JS
- On page refresh: call `/auth/refresh` automatically using cookie
- Implement `authInterceptor` in axios instance that auto-refreshes on 401

---

## 9.2 — Sign In Page (`/pages/auth/SignIn/`)

Route: `/signin`

### Layout
Uses `AuthLayout` split screen.
Left panel: animated brand experience (see 9.7).
Right panel: sign-in card.

### Sign In Card
```
DirectorByte logo (small, above heading)
Heading: "Welcome back"
Subheading: "Sign in to your account"

─── Form ────────────────────────────
Email input
  - leftIcon: Mail icon
  - placeholder: "you@example.com"
  - autoComplete: email
  - autoFocus on mount

Password input
  - leftIcon: Lock icon
  - built-in show/hide toggle
  - autoComplete: current-password

[Forgot your password?]  ← right-aligned link, below password field

[Remember this device] checkbox  ← extends session to 30 days

[Sign In]  ← primary full-width button
  - Loading state: spinner + "Signing in..."
  - On success: navigate to /home

─── Divider: "or continue with" ────

[G  Continue with Google]  ← secondary full-width button
  - Google "G" logo icon on left
  - Initiates Google OAuth flow

─── Footer ──────────────────────────
"Don't have an account?" [Sign up]
```

### Error handling
- Invalid credentials: inline error below form, shake animation on card
- Account locked: show "Too many attempts. Try again in X minutes." with countdown
- Email not verified: show specific message + "Resend verification email" button
  - Clicking resend: calls resendVerification(), shows success toast
- Suspended/banned: show "Account suspended. Contact support." with support link
- Network error: toast notification

### Behavior
- On successful login: store user in auth.store, navigate to `/home`
- If user was on a specific page before being redirected to sign in:
  restore that page after login (save redirect URL in session storage)
- Keyboard: Tab order correct, Enter submits form

---

## 9.3 — Sign Up Page (`/pages/auth/SignUp/`)

Route: `/signup`
Optional query param: `?promo=CODE` — pre-fills promo code field

### Sign Up Card
```
DirectorByte logo
Heading: "Create your account"
Subheading: "Start making films with AI"

─── Form ────────────────────────────
Display Name input
  - leftIcon: User icon
  - placeholder: "Your name"
  - maxLength: 50

Email input
  - leftIcon: Mail icon
  - placeholder: "you@example.com"

Password input
  - leftIcon: Lock icon
  - show/hide toggle
  - Password strength indicator (below input):
    ● ● ● ●  Weak / Fair / Strong / Very Strong
    Animated colored bar + label
    Strength rules: length, uppercase, number, special char

Confirm Password input
  - show/hide toggle
  - Real-time match indicator (✓ green / ✗ red)

[Promo Code] ← collapsible section
  - "Have a promo code?" link → expands input
  - If ?promo= param present: auto-expand and pre-fill
  - Input with "Apply" button
  - Shows discount applied if valid

─── Legal ───────────────────────────
[✓] I agree to the [Terms of Service] and [Privacy Policy]
  - Both are links that open in new tab
  - Cannot submit without checking this

[Create Account]  ← primary full-width button
  - Loading: "Creating your account..."

─── Divider ─────────────────────────

[G  Sign up with Google]

─── Footer ──────────────────────────
"Already have an account?" [Sign in]
```

### Password strength meter
```typescript
// Calculate strength: 0-4 based on:
const checks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
}
const score = Object.values(checks).filter(Boolean).length
// 0: none, 1: weak, 2: fair, 3: strong, 4: very strong
```

Visual bar colors:
- 1: --color-danger
- 2: --color-warning
- 3: --color-brand-400
- 4: --color-success

### Post-registration
- Server returns `{ message: "Check your email" }`
- Navigate to `/verify-email?email=user@example.com`
- Show email verification pending page

---

## 9.4 — Email Verification Pages (`/pages/auth/VerifyEmail/`)

### Verification Pending (`/verify-email`)
Shown immediately after signup.

```
[Envelope animation — animated SVG]
Heading: "Check your inbox"
Body: "We sent a verification link to [email@example.com]"
      "Click the link in the email to activate your account."

[Open Gmail]  ← if Gmail detected from email domain
[Open Outlook]  ← if Outlook domain

"Didn't receive it?"
[Resend verification email]  ← ghost button
  - Rate limited: disabled for 60 seconds after send
  - Shows countdown: "Resend in 45s"
  - On success: "Email sent! Check your inbox."

[← Back to sign in]
```

### Verification Success (`/verify-email/success`)
User lands here after clicking email link (server redirects here with success param).

```
[Animated checkmark — Framer Motion]
Heading: "Email verified!"
Body: "Your account is ready. Welcome to DirectorByte."

[Go to Studio]  ← primary button → /home
```

### Verification Failed (`/verify-email/error`)
If token is invalid or expired.

```
[Error icon animation]
Heading: "Link expired"
Body: "This verification link has expired or already been used."

[Request new link]  ← opens modal with email input
[Back to sign in]
```

---

## 9.5 — Password Reset Flow (`/pages/auth/PasswordReset/`)

### Forgot Password (`/forgot-password`)
```
[← Back to sign in]
Heading: "Reset your password"
Body: "Enter your email and we'll send you a reset link."

Email input (autoFocus)

[Send reset link]  ← full-width primary button
  - Loading: "Sending..."

─── Success state (replace form) ───
[Checkmark animation]
"Reset link sent to [email]"
"Check your inbox — the link expires in 1 hour."
[Resend] ← ghost, 60s cooldown
[Back to sign in]
```

### Reset Password (`/reset-password?token=`)
- On mount: validate token via API — if invalid, show error immediately

```
Heading: "Create new password"
Body: "Choose a strong password for your account."

New Password input + strength meter (same as signup)
Confirm Password input

[Reset Password]  ← primary button
  - Loading: "Updating..."

─── Success state ───
[Checkmark animation]
"Password updated successfully"
"You can now sign in with your new password."
[Sign in now]  ← navigates to /signin, pre-fills email if available
```

---

## 9.6 — Google OAuth Flow

### Initiation
- Clicking "Continue with Google" button:
  1. Show spinner on button
  2. Redirect to `/api/v1/auth/google`
  3. Browser redirects to Google consent screen

### Callback handling (`/oauth/callback`)
- Server handles the code exchange
- Server creates session, redirects to `/oauth/callback?token=...&refresh=...`
  (Or sets HttpOnly cookie and redirects to `/oauth/success`)
- Frontend `/oauth/callback` page:
  1. Extract tokens from URL params
  2. Store in auth.store
  3. Clear params from URL
  4. If new user → go to `/onboarding`
  5. If existing user → go to `/home`

### OAuth Error page (`/oauth/error`)
If something goes wrong with Google OAuth:
```
Heading: "Sign in with Google failed"
Body: "We couldn't complete the sign-in. [reason if available]"

[Try again]  ← retry OAuth
[Use email instead]  ← back to sign in
```

---

## 9.7 — Onboarding Flow (`/pages/auth/Onboarding/`)

Route: `/onboarding`
Only shown to brand-new users (first login).
Multi-step flow — each step is a separate screen with progress indicator.

### Step 1: Welcome
```
[Animated DirectorByte logo entrance]
"Welcome to DirectorByte, [Name]! 🎬"
"Let's set up your workspace in 2 minutes."

[Progress: Step 1 of 4]

[Get started →]
```

### Step 2: What will you create?
```
"What kind of films will you make?"
[Multi-select pill buttons]:
  🎬 Short Films    🎵 Music Videos    📖 Stories
  📚 Documentaries  🎮 Game Trailers   📣 Ads & Promos
  🎓 Educational    ✨ Just exploring

(Selection saves to user profile preferences)

[← Back]  [Continue →]
```

### Step 3: Choose your AI setup
```
"How do you want to use AI features?"

[Card A: Use my own API keys]  ← free option
  Icon: Key
  "Connect your own Gemini, OpenAI or other API keys."
  "Free to use — you control costs."
  Badge: FREE

[Card B: Subscribe to a plan]  ← paid option  
  Icon: Zap
  "Use DirectorByte's managed AI — no keys needed."
  "Start with a 7-day free trial."
  Badge: MOST POPULAR

Radio select between the two cards (brand ring on selected)

[← Back]  [Continue →]
  - If chose B: will show plan selection after step 4
```

### Step 4: Storage preference
```
"Where should we save your projects?"

[Card A: Local storage]  (default)
  Icon: HardDrive
  "Projects saved on our secure servers."
  "Access from any device."

[Card B: Google Drive]
  Icon: Google Drive icon (SVG)
  "Projects saved directly to your Google Drive."
  "You own your files."
  → Clicking this: triggers Google Drive OAuth

[← Back]  [Let's go! →]
```

### Completion
```
[Confetti animation — subtle, cinematic]
"You're all set. 🎬"
"Your first AI film is one click away."

[Open Studio →]  ← goes to /home
```

### Onboarding state
- Save current step in `localStorage('onboarding_step')` for resume
- If user navigates away mid-onboarding, show banner: "Complete your setup"
- After completion: set profile flag `onboardingComplete = true`
- Never show onboarding again after completion

---

## 9.8 — Auth Layout Left Panel (`/layouts/AuthLayout/LeftPanel`)

The decorative left side shown on desktop for all auth pages.
Must feel premium — this is the brand impression.

### Visual design
```
Background: animated gradient
  - Base: --color-surface-0 (#0D0D0F)
  - Overlay: radial gradient from brand violet, slow pulse animation
  - Subtle film grain texture (CSS noise filter)

Content (centered vertically):
  ┌─────────────────────────────┐
  │   [DirectorByte Logo]       │
  │   DirectorByte              │
  │   AI Film Generator         │
  │                             │
  │   ┌─────────────────────┐   │
  │   │ Feature highlight   │   │  ← rotating carousel
  │   │ card with icon      │   │
  │   └─────────────────────┘   │
  │   · · · · ·                 │  ← carousel dots
  │                             │
  │   "Trusted by 10,000+       │
  │    filmmakers worldwide"    │
  │                             │
  │   [Avatar] [Avatar] [Avatar]│
  │   ★★★★★ "Amazing tool..."  │  ← testimonial
  └─────────────────────────────┘
```

### Feature carousel (auto-rotates every 3 seconds)
Cards rotate through:
1. 🎬 "Script to Screen" — "Turn any idea into a full film script in seconds"
2. 🖼️ "AI Storyboard" — "Generate keyframes and visual scenes automatically"
3. 🎵 "AI Music & Voice" — "Add cinematic audio with one click"
4. 🚀 "Export Anywhere" — "MP4, GIF, or share directly from the app"
5. 🔑 "Your Keys, Your Control" — "Use any AI provider you choose"

Each card: icon (large, brand color) + title + body text
Transition: fade cross-dissolve with slight vertical movement

---

## 9.9 — Auth Route Guards

### `<RequireAuth>` component
```typescript
// Wraps protected pages
// If not authenticated: redirect to /signin with returnTo param
// If authenticated: render children
// Shows loading spinner during auth check (isLoading state)
```

### `<RequireGuest>` component
```typescript
// Wraps auth pages (signin, signup, etc.)
// If already authenticated: redirect to /home
// If not: render children
// Prevents authenticated users from seeing auth pages
```

### `<RequireOnboarding>` component
```typescript
// Checks if onboarding is complete
// If not: redirect to /onboarding
// Used on /home and other main pages for new users
```

### Route configuration (`/app/routes.tsx`)
```typescript
// Auth routes (guest only)
/signin         → <RequireGuest><SignIn /></RequireGuest>
/signup         → <RequireGuest><SignUp /></RequireGuest>
/forgot-password → <RequireGuest><ForgotPassword /></RequireGuest>
/reset-password → <RequireGuest><ResetPassword /></RequireGuest>
/verify-email   → VerifyEmailPending (no guard — accessible without auth)
/oauth/callback → OAuthCallback (no guard — handles token exchange)
/onboarding     → <RequireAuth><Onboarding /></RequireAuth>

// Protected routes
/home           → <RequireAuth><RequireOnboarding><Home /></RequireOnboarding></RequireAuth>
// ... all other app routes
```

---

## 9.10 — Completion Criteria

- [ ] Sign in page renders in AuthLayout with left panel
- [ ] Sign in works with email/password and updates auth.store
- [ ] "Remember this device" extends session correctly
- [ ] Account lockout message shows with countdown timer
- [ ] Unverified email shows resend option
- [ ] Sign up creates account and navigates to verify-email page
- [ ] Password strength meter animates correctly through 4 levels
- [ ] Promo code field auto-expands from `?promo=` URL param
- [ ] Email verification pending page shows correct email from URL state
- [ ] Clicking verify link in email leads to success page
- [ ] Forgot password sends email and shows cooldown on resend
- [ ] Reset password validates token on mount, shows error if expired
- [ ] Google OAuth button initiates correct redirect
- [ ] OAuth callback handles tokens and routes new vs returning users
- [ ] Onboarding 4-step flow saves preferences to profile
- [ ] Onboarding Drive step triggers real Drive OAuth
- [ ] `<RequireAuth>` redirects to signin with correct returnTo
- [ ] `<RequireGuest>` redirects authenticated users to /home
- [ ] After login, user is sent back to their original destination
- [ ] Left panel carousel animates and rotates correctly
- [ ] All forms work with keyboard navigation only (Tab + Enter)
- [ ] All error states shown inline, never via alert()
- [ ] Zero TypeScript errors
