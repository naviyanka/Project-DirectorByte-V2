# PHASE 17 — Polish: Animations, Responsive Design, Accessibility & Error States
> DirectorByte Rebuild · Depends on: PHASE_16 (Integration Complete)

---

## Objective

The app is fully functional after Phase 16. This phase elevates it from
"working" to "premium." Every animation should feel intentional, every
breakpoint should feel native, every error state should feel helpful,
and every element should be reachable without a mouse. DirectorByte
must feel like professional creative software — not a generic SaaS.

---

## 17.1 — Animation System

### Philosophy
- Animations communicate state changes — never decorative
- Duration: fast (120ms) for micro-interactions, normal (200ms) for transitions,
  slow (320ms) for page-level entries
- Easing: `--ease-out` for entrances, `--ease-in-out` for state changes,
  `--ease-spring` for playful interactive feedback
- Reduce motion: ALL animations must respect `prefers-reduced-motion`

### 17.1.1 — Framer Motion setup (`/lib/motion.ts`)

```typescript
// Shared variants — import these everywhere for consistency

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
}

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
}

export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
}
```

### 17.1.2 — Page transitions

Wrap all route content in `AnimatePresence` with `mode="wait"`:
```tsx
// In AppLayout:
<AnimatePresence mode="wait">
  <motion.div key={location.pathname} {...slideUp}>
    <Outlet />
  </motion.div>
</AnimatePresence>
```

Page-specific entry animations:
- Auth pages: `scaleIn` (card feels like it materializes)
- Home dashboard: `slideUp` with staggered children
- Studio workspace: `fadeIn` (no movement — workspace should feel stable)
- Admin pages: `slideUp`
- Modal content: `scaleIn` (handled inside Modal component)

### 17.1.3 — Micro-interactions

**Buttons:**
```css
.btn-primary {
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-brand);
}
.btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}
```

**Cards (hoverable):**
```css
.card-hoverable {
  transition: transform var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}
.card-hoverable:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.18);
  box-shadow: var(--shadow-lg);
}
```

**Form inputs (focus ring animation):**
```css
.input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-brand-400);
  transition: box-shadow var(--duration-fast) var(--ease-out);
}
```

**Sidebar nav items:**
```css
.nav-item {
  position: relative;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.nav-item::before {
  /* Left accent border */
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--color-brand-400);
  transform: scaleY(0);
  transition: transform var(--duration-normal) var(--ease-spring);
}
.nav-item.active::before {
  transform: scaleY(1);
}
```

**Toggle switch:**
```tsx
// Framer Motion spring animation for the thumb
<motion.span
  layout
  transition={{ type: "spring", stiffness: 500, damping: 35 }}
  className={cn("toggle-thumb", checked ? "translate-x-5" : "translate-x-0")}
/>
```

**Progress bar fill:**
```css
.progress-fill {
  transition: width 600ms var(--ease-out);
}
```

**Toast entrance:**
```tsx
// In Toast component:
<motion.div
  initial={{ opacity: 0, y: 16, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 8, scale: 0.96 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
>
```

**Number counters (stat cards):**
```typescript
// Animate numbers counting up on page enter
// Use framer-motion's useMotionValue + useTransform
function AnimatedStat({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, Math.round)
  
  useEffect(() => {
    animate(motionValue, value, { duration: 0.8, ease: "easeOut" })
  }, [value])
  
  return <motion.span>{rounded}</motion.span>
}
```

### 17.1.4 — Loading skeleton animations

All skeletons use a shimmer effect:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-200) 25%,
    var(--color-surface-300) 50%,
    var(--color-surface-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius-md);
}
```

### 17.1.5 — Success/confetti animations

**Onboarding completion:**
```typescript
// Subtle canvas confetti (use canvas-confetti library)
// Colors: brand violet, white, brand-200
// Only fire once, duration 3 seconds
// Respect prefers-reduced-motion: skip if true
```

**Subscription upgrade success:**
```typescript
// Same confetti, shorter burst
// Plus animated checkmark (draw-in SVG animation)
```

**Email verified:**
```typescript
// Lottie or CSS animated checkmark
// Circle draws in → checkmark strokes in → scales up slightly
// Colors: --color-success
```

### 17.1.6 — Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In Framer Motion:
```typescript
// Check in all animation variants:
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const animateVariant = prefersReducedMotion ? {} : slideUp
```

---

## 17.2 — Responsive Design Audit

All breakpoints defined in `tailwind.config.ts`:
```typescript
screens: {
  'xs': '375px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### 17.2.1 — Mobile (375px–767px)

**AppLayout:**
- Sidebar: hidden by default, slides in as full-height drawer on toggle
- Topbar: hamburger icon left, user avatar right, title centered
- Content: full width, 16px horizontal padding

**Home Dashboard:**
- Welcome header: stacked (avatar above text), New Project button below
- Recent projects: single column grid
- Usage/quick actions: stack below projects
- "Continue" card: full width, thumbnail left + info right

**Studio:**
- StudioLayout: bottom tab bar instead of left sidebar for stage navigation
- Stage navigator: horizontal scrollable tabs at bottom
- Settings drawer: full-screen bottom sheet instead of right panel
- Workspace: full width, minimal top bar

**Settings:**
- Tabs become vertical accordion instead of horizontal
- Each section full-width card

**Admin:**
- Admin is desktop-only — show "Admin center requires a desktop browser" on mobile
- Still render it (don't break), just show a banner

**Modals:**
- All modals: full-screen bottom sheet on mobile (`position: fixed, bottom: 0, width: 100%`)
- Animation: slide up from bottom

**Tables (DataTable):**
- On mobile: cards instead of table rows
- Each "card row" shows priority columns only
- "View all" expands to see full record
- Sort and filter accessible via filter button → bottom sheet

### 17.2.2 — Tablet (768px–1023px)

**AppLayout:**
- Sidebar: icon-only mode by default (64px), hover to see labels
- Main content: slightly reduced padding

**Home Dashboard:**
- 2-column project grid
- Usage and quick actions side by side

**Studio:**
- Left panel: 160px (slightly narrower)
- Right settings drawer: 280px

### 17.2.3 — Desktop (1024px+)

- Full sidebar (240px) expanded by default
- All panels visible simultaneously in studio
- Data-dense layouts with full information density

### 17.2.4 — Responsive audit checklist

Run through every page at 375px, 768px, and 1280px:

- [ ] Sign in / Sign up: form readable and usable on mobile
- [ ] Onboarding steps: cards stack on mobile correctly
- [ ] Home: projects grid responsive, no horizontal scroll
- [ ] Project list: table → cards on mobile
- [ ] Studio: bottom tab nav works, workspace scrolls properly
- [ ] Settings: accordion works, all sections reachable
- [ ] Pricing: plan cards stack on mobile, comparison clear
- [ ] Help center: article body readable (proper line-height and max-width)
- [ ] Support ticket: thread readable, reply box accessible
- [ ] Admin: desktop-only banner shown on mobile

---

## 17.3 — Accessibility (WCAG 2.1 AA)

### 17.3.1 — Keyboard navigation

Every interactive element must be keyboard-accessible:

**Focus management:**
```css
/* Global focus style — visible but beautiful */
:focus-visible {
  outline: 2px solid var(--color-brand-400);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove outline on click (only show on keyboard) */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Tab order rules:**
- All interactive elements must be reachable via Tab
- Tab order must match visual reading order (left-to-right, top-to-bottom)
- Skip navigation link at top of every page: `<a href="#main-content">Skip to content</a>`
  (visible on focus, hidden visually otherwise)
- Modal: focus trapped inside while open, returned to trigger on close
- Dropdown menus: arrow keys navigate options, Escape closes
- Table: Enter opens row action, Delete triggers delete confirmation

**Keyboard shortcuts:**
```
Global:
  Cmd/Ctrl + K     → Open global search
  Escape           → Close modal / drawer / dropdown

Studio:
  Cmd/Ctrl + S     → Manual save
  Cmd/Ctrl + Z     → Undo (project state)
  Cmd/Ctrl + Enter → Run current stage
  [ / ]            → Navigate to previous / next stage

Admin:
  /                → Focus search input (user list page)
```

Document all keyboard shortcuts in a discoverable keyboard shortcut modal:
- Triggered: `?` key anywhere in app
- Shows all available shortcuts for current context

### 17.3.2 — Screen reader support

**Semantic HTML:**
- `<main>`, `<nav>`, `<header>`, `<aside>`, `<section>` used correctly
- Headings: H1 per page (page title), H2 for sections, H3 for subsections
- Lists: use `<ul>/<li>` for navigation, not `<div>` soup
- Buttons: use `<button>`, never `<div onClick>`
- Links: use `<a>`, never `<span onClick>`

**ARIA attributes:**
```tsx
// Navigation
<nav aria-label="Main navigation">
<nav aria-label="Admin navigation">

// Current page
<a aria-current="page">

// Expanded state
<button aria-expanded={isOpen} aria-controls="sidebar">

// Loading states
<div aria-live="polite" aria-busy={isLoading}>

// Error messages
<input aria-invalid={!!error} aria-describedby="email-error" />
<p id="email-error" role="alert">{error}</p>

// Progress
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

// Toast notifications
<div role="status" aria-live="polite">  // for success/info
<div role="alert" aria-live="assertive">  // for errors

// Icon-only buttons
<button aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>

// Data tables
<table>
  <caption>User list — 234 total</caption>
  <th scope="col">Email</th>
  <th scope="row">[username]</th>  ← for row headers

// Skeleton loading
<div aria-label="Loading projects" aria-busy="true">
  <Skeleton />
</div>
```

### 17.3.3 — Color contrast

Verify all text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large):
- `--color-text-primary` (#FFFFFF) on `--color-surface-0` (#0D0D0F): 19.1:1 ✓
- `--color-text-secondary` (#9B9BAD) on `--color-surface-0`: 5.2:1 ✓
- `--color-text-tertiary` (#6B6B7E) on `--color-surface-0`: 3.4:1 ✓ (large text only)
- `--color-brand-400` (#8B5CF6) on `--color-surface-0`: 4.6:1 ✓
- White text on `--color-brand-400` button: 4.8:1 ✓
- `--color-danger` (#F43F5E) on surface: 4.7:1 ✓
- `--color-success` (#22D3A0) on surface: 4.9:1 ✓

Light mode — verify same ratios with inverted colors.

Use a contrast checker tool (axe DevTools or similar) to audit every page.

### 17.3.4 — Image and media

```tsx
// All images: meaningful alt text
<img src={avatar} alt={`${user.displayName}'s avatar`} />

// Decorative images: empty alt
<img src={bgPattern} alt="" role="presentation" />

// SVG icons used as content: title element
<svg aria-hidden="true" focusable="false">  // decorative

// Complex charts: table fallback or description
<figure aria-describedby="chart-desc">
  <Chart />
  <figcaption id="chart-desc">
    Revenue chart showing 23% growth over 30 days.
    [View as table]
  </figcaption>
</figure>
```

---

## 17.4 — Error States (Comprehensive)

Every component that fetches data, performs actions, or receives input
must handle all failure modes gracefully.

### 17.4.1 — Network error states

**Full page error (React Error Boundary):**
```
[Faint error icon — not alarming]
Something went wrong
We hit an unexpected error. Our team has been notified.

[Try again]  [Go to Home]

(In development: show error stack trace below in collapsed section)
```

**Inline error (data fetch failed, component-level):**
```
[Small warning icon]
Couldn't load [content name]
[Try again ↺] link
```

**Empty state (no error, just no data):**
```
[Context-specific illustration]
[Title] — e.g., "No projects yet"
[Body] — e.g., "Create your first film project to get started"
[CTA button] — e.g., "+ New Project"
```

Empty state variations to implement:
- No projects (home + project list)
- No API keys configured (settings > API keys)
- No support tickets (support history)
- No search results (global search, help search)
- No notifications (notification panel)
- No invoices (billing history)
- Admin: no users found (search result)
- Admin: no open tickets
- Admin: no audit log entries for filter

### 17.4.2 — Form validation error states

**Field-level errors:**
```tsx
// Error appears below the field, never above
// Red ring on input
// Red text error message with icon
// Aria: role="alert" on error, aria-describedby on input

<Input
  error="Email address is already registered"
  // renders: red border + "Email address is already registered" below
/>
```

**Form-level errors (server errors not tied to a field):**
```tsx
// Banner above the submit button, not at top of form
<Alert variant="danger">
  Incorrect email or password. Try again or reset your password.
</Alert>
```

**Submission errors:**
- 422 validation: map server field errors to form field errors
- 409 conflict: show specific conflict message
- 429 rate limit: "Too many attempts. Try again in X seconds." with countdown
- 500: "Something went wrong on our end. Please try again."
- Network offline: "You appear to be offline. Check your connection."

### 17.4.3 — Studio-specific errors

**Job failed:**
```
[Red warning icon]
Generation failed
[error message from provider]

[Retry]  [Change provider ↗]  [Contact support]
```

Provider error message translation:
```typescript
// Map cryptic provider errors to user-friendly messages:
const friendlyError = {
  'invalid_api_key': 'Your API key is invalid or expired. Please update it in Settings.',
  'rate_limit_exceeded': 'Provider rate limit reached. Try again in a few minutes.',
  'content_policy_violation': 'The prompt was blocked by the AI provider. Try rephrasing.',
  'quota_exceeded': "You've used all your credits this month. Upgrade or wait for reset.",
  'model_not_found': 'This AI model is no longer available. Please select another.',
}
```

**Quota exceeded during generation:**
```
[Lock icon]
You've used 100% of your monthly credits

[Upgrade plan]  [Learn about credit usage]
Resets in: 14 days, 3 hours
```

**API key missing (free user without keys):**
```
[Key icon]
API key required for [Module Name]

To use this feature, add your API key in Settings.
[Add API Key]  [Learn more]
```

### 17.4.4 — Auth error states

**Session expired mid-session:**
- Access token expires → silent refresh
- If refresh also fails (e.g., user deleted from another device):
  - Show non-blocking toast: "Session expired. Signing you out..."
  - Redirect to /signin after 2 seconds
  - Preserve returnTo so user can continue where they left off

**Account suspended mid-session:**
- On any API call returning 403 SUSPENDED:
  - Show full-screen suspension overlay (not dismissible)
  - "Your account has been suspended. Contact support."
  - Support link

**Impersonation session expired:**
- On 401 in impersonation context:
  - Show banner: "Impersonation session expired"
  - Return to admin

### 17.4.5 — Payment error states

**Payment failed banner:**
```
⚠️ Payment failed for your subscription
  Update your payment info to keep access.
  [Update payment] [Dismiss]
  Access expires: March 15, 2025
```

**Grace period expired state:**
```
// On any page, if subscription status = EXPIRED:
// Non-dismissible top banner (not overlay — don't block app use):
[Crown icon] Your subscription has expired
  Renew now to restore access to [features].
  [View plans]
```

---

## 17.5 — Performance Optimizations

### 17.5.1 — Code splitting

```typescript
// All major routes lazy-loaded:
const Studio = lazy(() => import('./features/studio/Studio'))
const Admin = lazy(() => import('./features/admin/AdminApp'))
const Settings = lazy(() => import('./features/settings/Settings'))

// Wrap in Suspense with skeleton fallback:
<Suspense fallback={<PageSkeleton />}>
  <Studio />
</Suspense>
```

### 17.5.2 — Image optimization

```tsx
// All images: lazy loading
<img loading="lazy" decoding="async" />

// Thumbnails: use low-res placeholder until loaded
// Avatar: if network slow, show initial letter immediately
// Project thumbnails: gradient placeholder while loading

// Avoid layout shift: always set width/height or aspect-ratio on images
```

### 17.5.3 — List virtualization

For lists over 100 items (user list in admin, audit log):
```tsx
// Use @tanstack/react-virtual for windowed rendering
import { useVirtualizer } from '@tanstack/react-virtual'
```

### 17.5.4 — React Query cache strategy

```typescript
// Expensive queries: longer staleTime
useQuery({ queryKey: ['plans'], staleTime: 30 * 60 * 1000 })  // 30 min

// User's own data: shorter staleTime
useQuery({ queryKey: ['user', 'me'], staleTime: 2 * 60 * 1000 })  // 2 min

// Admin data: always fresh
useQuery({ queryKey: ['admin', 'kpis'], staleTime: 30 * 1000 })  // 30 sec
```

### 17.5.5 — Bundle size audit

After building:
```bash
# Check bundle sizes:
npx vite-bundle-visualizer

# Targets:
# Initial JS: < 200KB (gzipped)
# Admin bundle (lazy): < 150KB (gzipped)
# Studio bundle (lazy): < 200KB (gzipped)
```

Flag any dependency over 50KB gzipped for potential replacement.

---

## 17.6 — Final QA Checklist

### Visual QA
- [ ] Dark mode: no white flashes, all surfaces correct
- [ ] Light mode: all text readable, all borders visible
- [ ] All buttons have correct hover, active, disabled, loading states
- [ ] All forms have correct default, focus, error, success states
- [ ] All cards have correct hover state (if hoverable)
- [ ] Loading skeletons match layout of actual content exactly
- [ ] All empty states have illustration + message + CTA
- [ ] All error states have clear message + recovery action
- [ ] Brand gradient and glow applied correctly to primary actions
- [ ] No orphaned hardcoded colors (grep for hex values not in tokens)

### Interaction QA
- [ ] Tab through entire sign-in flow: only keyboard
- [ ] Tab through entire studio pipeline: only keyboard
- [ ] Screen reader announces all form errors correctly
- [ ] Modal traps focus, returns it on close
- [ ] Toast appears and disappears with correct timing
- [ ] All animations disabled when prefers-reduced-motion is set
- [ ] Keyboard shortcut Cmd+K opens global search
- [ ] Global search keyboard nav (arrow + Enter) works

### Responsive QA (375px / 768px / 1280px)
- [ ] All pages scroll vertically only (no horizontal scroll)
- [ ] All text readable without zooming (min 13px)
- [ ] All tap targets ≥ 44px (WCAG touch target)
- [ ] Sidebar drawer works on mobile (opens, closes, traps scroll)
- [ ] Studio bottom nav works on mobile
- [ ] Modals: full-screen bottom sheet on mobile

### Performance QA
- [ ] Lighthouse score: Performance ≥ 85, Accessibility ≥ 95
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] No images missing width/height attributes
- [ ] No console errors in production build
- [ ] No 404s in network tab

### Accessibility QA
- [ ] axe DevTools: 0 critical/serious violations on all pages
- [ ] All form inputs have associated labels
- [ ] All icon-only buttons have aria-label
- [ ] Color contrast passes on all text elements
- [ ] Focus indicator visible on all interactive elements

---

## 17.7 — Completion Criteria

- [ ] All animations implemented with correct timing and easing
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] All Framer Motion variants use shared motion library
- [ ] Responsive layout tested at 375px, 768px, 1280px for all pages
- [ ] Mobile sidebar drawer works correctly
- [ ] Studio has mobile-specific bottom tab navigation
- [ ] Skip navigation link present on all pages
- [ ] Focus styles visible and consistent
- [ ] Zero axe DevTools critical/serious accessibility violations
- [ ] All form errors show inline with correct ARIA
- [ ] All empty states implemented
- [ ] All error boundaries implemented with recovery options
- [ ] Studio job errors show user-friendly messages
- [ ] Auth session expiry handled gracefully
- [ ] Lighthouse accessibility score ≥ 95
- [ ] Lighthouse performance score ≥ 85
- [ ] Zero horizontal scroll at any breakpoint
- [ ] All tap targets ≥ 44px on mobile
