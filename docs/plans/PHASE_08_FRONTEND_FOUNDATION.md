# PHASE 08 — Frontend Foundation: Design System & Global Components
> DirectorByte Rebuild · Depends on: PHASE_07 (Backend Complete)

---

## Objective

Build the design system that every other frontend phase will use.
This is the most important phase for visual quality — it determines
how the entire app looks and feels. Study the UI references deeply
before writing any code.

---

## MANDATORY: Study These References First

Before writing any component, Antigravity must study:

1. **UI/UX Pro Max Skill**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
   - Read ALL files in the repo — especially the prompts and patterns
   - Note: spacing rhythm, typography scale, component anatomy, motion principles

2. **UUPM Design Gallery**: https://www.uupm.cc/
   - Study the dashboard examples, SaaS UI patterns, dark interfaces
   - Identify: color usage, glassmorphism elements (used sparingly), 
     card design, sidebar patterns, data display components

DirectorByte visual identity:
- Primary feel: **Premium creative software** (think Runway ML, Pika, Adobe)
- Not: corporate SaaS, generic dashboard, Material UI defaults
- Dark mode: cinema-grade dark (#0D0D0F base), not just "dark gray"
- Accent color: electric violet/indigo spectrum (creative, cutting-edge)
- Typography: Sharp, confident — not rounded/friendly
- Motion: purposeful, not decorative. Every animation has a reason.

---

## 8.1 — Design Tokens (`/src/design-system/tokens.css`)

Define ALL design tokens as CSS custom properties.
Use these tokens EVERYWHERE — never hardcode colors or spacing.

### Color System

```css
/* ─── Brand / Accent ─── */
--color-brand-50:  #f0edff;
--color-brand-100: #ddd6ff;
--color-brand-200: #c4b5fd;
--color-brand-300: #a78bfa;
--color-brand-400: #8b5cf6;   /* primary action */
--color-brand-500: #7c3aed;   /* hover */
--color-brand-600: #6d28d9;   /* active / pressed */
--color-brand-700: #5b21b6;
--color-brand-800: #4c1d95;
--color-brand-900: #2e1065;

/* ─── Surface / Background ─── */
--color-surface-0:   #0D0D0F;   /* darkest background (dark mode base) */
--color-surface-50:  #111114;   /* sidebar / panels */
--color-surface-100: #18181D;   /* cards */
--color-surface-200: #1E1E25;   /* elevated cards */
--color-surface-300: #26262F;   /* hover states */
--color-surface-400: #2E2E39;   /* borders / dividers */
--color-surface-500: #3A3A47;   /* input backgrounds */

/* Light mode surfaces */
--color-light-0:     #FFFFFF;
--color-light-50:    #F8F8FA;
--color-light-100:   #F1F1F5;
--color-light-200:   #E8E8EF;
--color-light-300:   #D8D8E3;
--color-light-400:   #C4C4D0;

/* ─── Text ─── */
--color-text-primary:   #FFFFFF;    /* dark mode primary */
--color-text-secondary: #9B9BAD;    /* muted text */
--color-text-tertiary:  #6B6B7E;    /* placeholder / hint */
--color-text-inverse:   #0D0D0F;    /* on light backgrounds */

/* ─── Semantic ─── */
--color-success:      #22D3A0;
--color-success-bg:   rgba(34, 211, 160, 0.1);
--color-warning:      #F59E0B;
--color-warning-bg:   rgba(245, 158, 11, 0.1);
--color-danger:       #F43F5E;
--color-danger-bg:    rgba(244, 63, 94, 0.1);
--color-info:         #60A5FA;
--color-info-bg:      rgba(96, 165, 250, 0.1);

/* ─── Borders ─── */
--border-subtle:     1px solid rgba(255,255,255,0.06);
--border-default:    1px solid rgba(255,255,255,0.10);
--border-strong:     1px solid rgba(255,255,255,0.18);
--border-brand:      1px solid var(--color-brand-400);

/* ─── Spacing Scale ─── */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-7: 28px;  --space-8: 32px;  --space-10: 40px;
--space-12: 48px; --space-16: 64px; --space-20: 80px;

/* ─── Typography ─── */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs:   11px;  --leading-xs:  16px;
--text-sm:   13px;  --leading-sm:  18px;
--text-base: 15px;  --leading-base: 22px;
--text-lg:   17px;  --leading-lg:  24px;
--text-xl:   20px;  --leading-xl:  28px;
--text-2xl:  24px;  --leading-2xl: 32px;
--text-3xl:  30px;  --leading-3xl: 38px;
--text-4xl:  36px;  --leading-4xl: 44px;

--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;

/* ─── Radius ─── */
--radius-sm:  4px;  --radius-md:  8px;
--radius-lg:  12px; --radius-xl:  16px;
--radius-2xl: 20px; --radius-full: 9999px;

/* ─── Shadows ─── */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
--shadow-md:  0 4px 12px rgba(0,0,0,0.4);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.5);
--shadow-brand: 0 0 20px rgba(139, 92, 246, 0.35);

/* ─── Animation ─── */
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast:   120ms;
--duration-normal: 200ms;
--duration-slow:   320ms;

/* ─── Z-index ─── */
--z-dropdown: 100; --z-modal: 200;
--z-toast: 300;    --z-tooltip: 400;
```

---

## 8.2 — Base Component Library

Build each component as a typed, composable React component.
All components must work perfectly in dark mode (default) and light mode.

### Button (`/components/Button/`)
Variants: `primary`, `secondary`, `ghost`, `danger`, `success`, `outline`
Sizes: `xs`, `sm`, `md` (default), `lg`
States: default, hover, active, loading (spinner), disabled
Special: `iconLeft`, `iconRight` props, `fullWidth` prop
Loading state: replace label with spinner, keep button width stable

Visual: primary buttons have brand gradient, slight glow on hover.
Never use pure flat color for primary — it should feel electric.

### Input (`/components/Input/`)
Types: text, email, password, search, number
States: default, focus (brand ring), error (red ring + message), success
Sizes: sm, md, lg
Props: `label`, `hint`, `error`, `leftAddon`, `rightAddon`, `leftIcon`, `rightIcon`
Password input: built-in show/hide toggle
Search input: built-in clear button when has value

### Textarea (`/components/Textarea/`)
Auto-resize to content (up to max-height then scroll)
Character counter (show when `maxLength` provided)

### Select (`/components/Select/`)
Custom styled dropdown (not native select)
Searchable option (add search when options > 8)
Multi-select variant
Option groups supported

### Checkbox & Radio (`/components/Checkbox/`, `/components/Radio/`)
Custom styled, brand accent when checked
Indeterminate state for Checkbox
Radio group component

### Toggle (`/components/Toggle/`)
Animated slide with brand color when on
Size variants: sm, md, lg
Label position: left or right

### Badge (`/components/Badge/`)
Variants: default, success, warning, danger, info, brand
Sizes: sm, md
Dot variant (just colored circle, no text)

### Avatar (`/components/Avatar/`)
Image with fallback to initials
Sizes: xs (24), sm (32), md (40), lg (48), xl (64)
Status indicator: online dot (green/gray)
Group: overlapping avatars with +N overflow

### Card (`/components/Card/`)
Variants: default (dark surface), elevated, bordered, ghost
Props: `header`, `footer`, `noPadding`, `hoverable`, `clickable`
Hoverable: subtle lift + border brightness on hover

### Modal (`/components/Modal/`)
Radix UI Dialog under the hood
Sizes: sm (400px), md (560px), lg (720px), full (90vw)
Parts: Modal, Modal.Header, Modal.Body, Modal.Footer
Animated: scale + fade in, fade out
Backdrop: blur(4px) darkened
Close button in corner

### Drawer (`/components/Drawer/`)
Slide in from right (or bottom on mobile)
Same size variants as Modal
Used for: settings panels, API key forms, user detail in admin

### Toast (`/components/Toast/`)
Radix UI Toast under the hood
Variants: success, error, warning, info
Position: bottom-right (desktop), bottom-center (mobile)
Auto-dismiss: 4 seconds (configurable)
Progress bar showing time remaining
Max 5 toasts stacked

### Tooltip (`/components/Tooltip/`)
Radix UI Tooltip
Delay 400ms on hover
Max width: 200px, wraps text
Positions: top, bottom, left, right (auto-adjust)

### Dropdown Menu (`/components/DropdownMenu/`)
Radix UI DropdownMenu
Used for: user avatar menu, row action menus, kebab menus
Animated: scale + fade
Items: regular, checkbox, radio, separator, destructive variant

### Table (`/components/Table/`)
Sortable columns (click header to sort, click again to reverse)
Row selection with checkboxes
Pagination built-in (page size options: 10, 25, 50)
Loading skeleton rows
Empty state slot
Row hover highlight
Sticky header option

### DataTable (`/components/DataTable/`)
Higher-level table built on Table
Takes: `columns` config + `data` array + `loading` bool
Handles: sort state, pagination state, selection state
Export to CSV button (optional)

### Pagination (`/components/Pagination/`)
Previous, Next, page numbers (show 5 max with ellipsis)
Items per page select
"Showing X-Y of Z" text

### Skeleton (`/components/Skeleton/`)
Animated shimmer loading placeholders
Variants: text, avatar, card, table-row
Compose to match any layout

### EmptyState (`/components/EmptyState/`)
Icon + title + description + optional CTA button
Used when: no search results, no projects, no tickets, etc.
Illustration variants per context

### ErrorBoundary (`/components/ErrorBoundary/`)
React error boundary with fallback UI
Fallback shows: error message + "Try again" button + "Contact support" link

### Spinner (`/components/Spinner/`)
Sizes: sm, md, lg, xl
Color: brand or inherit

### Stat (`/components/Stat/`)
Metric display card: label + large value + optional delta (↑12% green, ↓3% red)
Used in: admin dashboard, subscription usage

### ProgressBar (`/components/ProgressBar/`)
Linear progress, color-coded by percentage:
- 0-79%: brand color
- 80-94%: warning yellow
- 95-100%: danger red
Animated fill transition

### CodeBlock (`/components/CodeBlock/`)
Syntax highlighted code display
Copy-to-clipboard button
Language label

### RichTextEditor (`/components/RichTextEditor/`)
TipTap under the hood
Features: bold, italic, underline, headings, lists, links, images, code
Used in: help articles editor, email template editor

---

## 8.3 — Layout Components

### Sidebar (`/layouts/Sidebar/`)
Fixed left sidebar: 240px wide, collapsible to 64px (icon-only mode)
Dark surface base (--color-surface-50)
Logo at top with app name (collapses to logo icon only)
Navigation sections with group labels
Active item: brand accent left border + subtle brand background
Hover: --color-surface-300
User avatar + name + plan badge at bottom
Version number at very bottom

Navigation items have:
- Icon (required)
- Label (hidden when collapsed)
- Badge (optional, for unread counts)
- Active state
- Sub-items (collapsible, with animation)

### Topbar (`/layouts/Topbar/`)
64px tall, full width minus sidebar
Contents (left to right):
  - Sidebar toggle button (hamburger / X)
  - Breadcrumb or page title
  - [spacer]
  - Search button (opens global search modal)
  - Notification bell (with unread dot)
  - User avatar (opens dropdown: Profile, Settings, Support, Sign out)

### AppLayout (`/layouts/AppLayout/`)
Sidebar (fixed left) + Topbar (fixed top) + main content area
Content area: `overflow-y: auto` with scrollable padding
Responsive: sidebar collapses to mobile drawer on < 768px

### AuthLayout (`/layouts/AuthLayout/`)
Split screen: left = decorative panel (brand), right = form panel
Left panel: animated gradient background, DirectorByte logo, tagline,
            rotating feature highlights or screenshot
Right panel: centered card with form
Mobile: stack vertically, decorative panel becomes header banner

### AdminLayout (`/layouts/AdminLayout/`)
Similar to AppLayout but with different nav items and admin-only indicators
Persistent admin banner at top of page: "Admin Mode — DirectorByte Admin Center"
Different color accent for admin (amber/gold vs brand violet for users)

### StudioLayout (`/layouts/StudioLayout/`)
Full-screen: no sidebar, minimal top bar
Left panel: pipeline stage navigator (vertical step list)
Center: active stage workspace (max 90% of available width)
Right panel: collapsible settings/properties drawer
Bottom: timeline/progress bar (optional for video assembly)

---

## 8.4 — Global State Setup

### auth.store.ts (Zustand)
```typescript
{
  user: User | null,
  accessToken: string | null,
  isAuthenticated: bool,
  isLoading: bool,
  // actions:
  setUser, setToken, logout, refreshUser
}
```

### ui.store.ts (Zustand)
```typescript
{
  theme: 'dark' | 'light' | 'system',
  sidebarOpen: bool,
  sidebarCollapsed: bool,
  toasts: Toast[],
  activeModal: string | null,
  // actions:
  setTheme, toggleSidebar, addToast, removeToast, openModal, closeModal
}
```

### React Query Setup (`/lib/queryClient.ts`)
- defaultOptions: staleTime 5min, retry 2
- Global error handler: 401 → trigger logout, 403 → redirect
- Global loading state accessible via `useIsFetching()`

---

## 8.5 — Global Features

### Theme System
- Default: dark mode
- Toggle: saved to localStorage and user profile
- Implemented via data-theme attribute on `<html>`
- All CSS variables defined for both themes
- System: prefers-color-scheme media query

### Global Search (`/components/GlobalSearch/`)
- Triggered by: clicking topbar search icon or Cmd+K
- Opens modal with search input
- Searches: projects (title), help articles, admin users (admin only)
- Keyboard navigation: arrow keys to move, Enter to go
- Recent searches (localStorage)

### Notification Panel (`/components/NotificationPanel/`)
- Opened by topbar bell icon
- Slide-in panel from right (not page navigation)
- List of notifications, newest first
- "Mark all read" button
- Real-time updates via polling every 30 seconds

### Maintenance Mode
- Frontend checks GET /api/v1/health on load
- If maintenance mode active: show full-screen maintenance page
- Do not attempt other API calls

---

## 8.6 — Completion Criteria

- [ ] All design tokens defined in tokens.css, no hardcoded values
- [ ] All components built, documented, and exported from index.ts
- [ ] Every component works in dark AND light mode
- [ ] All components tested at 375px (mobile) and 1280px+ (desktop)
- [ ] Sidebar collapses correctly on mobile (drawer), desktop (icon-only)
- [ ] AuthLayout renders correctly with split-screen on desktop
- [ ] StudioLayout renders with side panels and full workspace
- [ ] Zustand stores initialize correctly
- [ ] React Query client set up with interceptors
- [ ] Global search modal opens with Cmd+K
- [ ] Theme toggle works and persists
- [ ] Zero TypeScript errors in design system
- [ ] Design matches the reference quality from uupm.cc
