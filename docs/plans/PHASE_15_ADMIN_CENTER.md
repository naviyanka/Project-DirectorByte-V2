# PHASE 15 — Frontend: Admin Center
> DirectorByte Rebuild · Depends on: PHASE_14 (Support Complete)

---

## Objective

Build the complete admin center frontend. Admin center is fully isolated from
the user-facing app: separate route prefix, separate layout, separate auth,
different visual accent color (amber/gold vs brand violet). Every panel
described in Phase 06 backend needs a frontend counterpart.

---

## 15.1 — Admin Auth (`/pages/admin/AdminLogin/`)

Route: `/admin/login`

Completely separate from the user sign-in page.
No sidebar, no topbar — standalone full-screen page.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                 [Shield icon — amber/gold color]                │
│               DirectorByte Admin Center                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Username                                                  │  │
│  │  [input, autoFocus]                                       │  │
│  │                                                           │  │
│  │  Password                                                 │  │
│  │  [password input, show/hide]                             │  │
│  │                                                           │  │
│  │  [Sign In to Admin Center]  ← amber primary button       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  This area is restricted. Unauthorized access is prohibited.   │
│  All actions are logged.                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Design: dark background (same as app), amber/gold accent instead of violet.
Rate limiting feedback: "Too many attempts. Try again in 14 minutes." with countdown.

Admin auth store (`/store/admin.store.ts`):
```typescript
{
  admin: { username, sessionId, loggedInAt } | null,
  isAuthenticated: bool,
  // actions: setAdmin, logout
}
```

Admin token stored in memory (not localStorage). HttpOnly cookie from server.

---

## 15.2 — Admin Layout (`/layouts/AdminLayout/`)

All admin pages use this layout.

```
┌───────────────────────────────────────────────────────────────────┐
│ 🛡️ ADMIN MODE — DirectorByte Admin Center         [admin] [↳ Exit]│  ← amber banner
├─────────────┬─────────────────────────────────────────────────────┤
│ Admin       │ Page content                                        │
│ Sidebar     │                                                     │
│ (220px)     │                                                     │
│             │                                                     │
└─────────────┴─────────────────────────────────────────────────────┘
```

Admin banner (persistent top bar, amber background, 36px):
- Shield icon + "ADMIN MODE — DirectorByte Admin Center"
- Right side: admin username + "Exit Admin" button

Admin Sidebar:
```
┌──────────────────────────┐
│ ◈ Admin Center           │
├──────────────────────────┤
│ MAIN                     │
│  📊 Overview             │
│  👥 Users                │
│  💳 Subscriptions        │
│  🎟️ Promo Codes          │
├──────────────────────────┤
│ CONFIGURATION            │
│  🔧 API & Services       │
│  📋 Content              │
│  ⚙️ System Settings      │
├──────────────────────────┤
│ SUPPORT                  │
│  🎫 Support Tickets [3]  │  ← badge for open tickets
│  📣 Announcements        │
├──────────────────────────┤
│ SECURITY                 │
│  📜 Audit Log            │
└──────────────────────────┘
```

Active item: amber left border + amber background tint.
Ticket badge: amber circle with count.

Admin guard component (`<RequireAdminAuth>`):
```typescript
// Checks admin.store isAuthenticated
// If not: redirect to /admin/login
// All /admin/* routes are wrapped
```

---

## 15.3 — Admin Overview Dashboard (`/pages/admin/Overview/`)

Route: `/admin`

### KPI Cards Row (4 cards)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Users  │  │ Active (24h) │  │ MRR          │  │ Open Tickets │
│ 4,827        │  │ 312          │  │ $8,420       │  │ 14           │
│ ↑ 23 today   │  │ ↑ 8%        │  │ ↑ $420 MoM   │  │ 3 urgent    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

Second row:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ New Signups  │  │ Churn Rate   │  │ Active Subs  │  │ System       │
│ Today: 23    │  │ 2.3%         │  │ 412          │  │ ✅ All OK   │
│ This mo: 287 │  │ ↓ 0.5%      │  │ Creator: 280 │  │             │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

KPI card design:
```
┌────────────────────────┐
│ Total Users            │  ← label
│ 4,827                  │  ← large value (--text-4xl, bold)
│ ↑ 23 new today         │  ← delta (green if positive, red if negative)
│ ───────────────────    │
│ [sparkline chart 60px] │  ← 7-day mini trend
└────────────────────────┘
```

### Charts Row

Left (60%): User growth + Revenue chart (dual-axis line chart)
- Period selector: 7d / 30d / 90d / 1yr
- Toggle: Users / Revenue / Both

Right (40%): Plan distribution donut chart
- Segments: Free / Creator / Studio / colors
- Center: total subscribers count

Second chart row:
- Left: Generation job volume bar chart (by module)
- Right: Top 5 API providers in use (horizontal bars)

### Recent Activity Feed
Last 20 events (auto-refreshes every 30 seconds):
```
┌───────────────────────────────────────────────────────────────┐
│ Recent Activity                                               │
│ ─────────────────────────────────────────────────────────────│
│ 🟢  New signup · user@gmail.com · 2 min ago                   │
│ 💳  Upgraded to Studio · naviyanka@gmail.com · 5 min ago      │
│ 🎫  New ticket #48 · High priority · 8 min ago               │
│ 🔴  Payment failed · user2@example.com · 15 min ago          │
│ 🟢  New signup · test@example.com · 22 min ago               │
│                                                               │
│ [Load more]                                                   │
└───────────────────────────────────────────────────────────────┘
```

### Quick Actions
```
[+ Create Promo Code]  [📣 Send Announcement]  [👥 View New Users]
```

---

## 15.4 — User Management (`/pages/admin/Users/`)

Route: `/admin/users`

### Users Table
```
Users (4,827)

[Search: search by name or email...]  [Plan: All ▼]  [Status: All ▼]
                                      [Date joined ▼]  [Export CSV]

┌──────┬──────────────────────┬────────────┬──────────┬──────────────┬────────────┬─────────┐
│  □   │  User                │  Plan      │  Storage │  Joined      │  Last Login│  Status │
├──────┼──────────────────────┼────────────┼──────────┼──────────────┼────────────┼─────────┤
│  □   │ [Avatar] Navi Singh  │ Creator    │ 8.2 GB   │ Apr 1, 2025  │ 2 min ago  │ Active  │
│      │ naviyanka@gmail.com  │            │          │              │            │  ···    │
├──────┼──────────────────────┼────────────┼──────────┼──────────────┼────────────┼─────────┤
│  □   │ [Avatar] Jane Doe    │ Studio     │ 42.1 GB  │ Mar 15, 2025 │ 1 hour ago │ Active  │
│      │ jane@example.com     │            │          │              │            │  ···    │
└──────┴──────────────────────┴────────────┴──────────┴──────────────┴────────────┴─────────┘
```

Row actions (··· dropdown):
- View details
- Impersonate user
- Send email
- Reset password
- Suspend / Ban / Enable (contextual)
- Assign plan

Bulk action bar (when rows checked):
```
3 selected  [Assign Plan ▼]  [Send Email]  [Suspend]  [Export]  [Clear]
```

### User Detail Page (`/pages/admin/UserDetail/`)

Route: `/admin/users/:id`

Full-screen detail view with tab navigation.

```
[← Users]  Navi Singh  [Active ✓]  [Suspend]  [Impersonate ▶]

Tabs: Profile | Subscription | Projects | API Keys | Support | Audit
```

**Profile Tab:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Avatar 96px]  Navi Singh                                      │
│                naviyanka@gmail.com  ·  Email verified ✓        │
│                Joined: Apr 1, 2025  ·  Last login: 2 min ago   │
│                Delhi, IN                                       │
├────────────────────────────────────────────────────────────────┤
│ Display Name    [Navi Singh              ] [Edit]              │
│ Bio             [Currently building stuff]                     │
│ Status          [Active ▼]                                     │
│                                                                │
│ [Save Changes]                                                 │
├────────────────────────────────────────────────────────────────┤
│ ACCOUNT ACTIONS                                                │
│ [🔑 Reset Password (Email)]  [🔑 Set Password Directly]        │
│ [📧 Send Message]            [🗑️ Delete Account]               │
├────────────────────────────────────────────────────────────────┤
│ ACTIVE SESSIONS (2)                      [Terminate All]       │
│ 💻 Chrome/Windows  ·  Delhi  ·  2 min ago   [Terminate]       │
│ 📱 Safari/iPhone   ·  Delhi  ·  1 hr ago    [Terminate]       │
└────────────────────────────────────────────────────────────────┘
```

**Subscription Tab:**
```
Current Plan: Creator  ·  Monthly  ·  Renews May 31

[Change Plan ▼]  [Override Expiry]  [Add Credits]  [Remove Credits]

Payment History:
Date       Amount   Status   Invoice
May 1      $19.00   Paid     [↓]
Apr 1      $19.00   Paid     [↓]

[Flag for review]
```

**Projects Tab:**
Table of all user's projects with open/delete actions.

**API Keys Tab:**
Table showing which modules have keys configured (provider name + masked hint).
[Flag problematic key] button per row.

**Support Tab:**
All tickets from this user with links to open each.
[Open ticket on behalf of user →] button.

**Audit Tab:**
All admin actions taken on this account (from AuditLog, filtered by targetUserId).
```
Timestamp          Admin      Action              Details
May 7, 10:23 AM   admin      PASSWORD_RESET      Method: email
May 5, 2:14 PM    admin      IMPERSONATION_START  Duration: 00:12:34
```

### Impersonation Flow
Clicking "Impersonate ▶":
1. Modal: "Impersonate naviyanka@gmail.com? This will be logged."
   [Cancel] [Impersonate]
2. On confirm: opens NEW browser tab with user session
3. In the user app, amber banner at very top: "Impersonating naviyanka@gmail.com | [Exit impersonation]"
4. Clicking exit: closes impersonation, returns admin to admin center

---

## 15.5 — Subscription Management (`/pages/admin/Subscriptions/`)

Route: `/admin/subscriptions`

```
Subscriptions (412 active)

[Status: All ▼]  [Plan: All ▼]  [Billing: All ▼]  [Search user...]

Table: User | Plan | Status | Billing | Period End | MRR | Actions

Actions: Edit | Assign Plan | Adjust Credits | View User
```

### Assign Plan Modal
```
Assign Plan to: Navi Singh

Plan: [Creator ▼]
Billing Cycle: [Monthly ▼]
Duration: [  ] Custom (days):  [30]  ← if blank, permanent
Reason (internal note): [text]

[Cancel]  [Assign Plan]
```

### Adjust Credits Modal
```
Adjust Credits: Navi Singh
Current: 380 / 500 used

Adjustment: [+ Add  ○  - Remove]
Amount: [____] credits
Reason: [required, internal log]

[Cancel]  [Apply Adjustment]
```

---

## 15.6 — Plan Management (`/pages/admin/Plans/`)

Route: `/admin/plans`

```
Plans (3 active)           [+ Create Plan]

┌──────────────┬──────────┬────────────┬────────────┬────────────┬──────────────┐
│ Plan         │ Price    │ Subscribers│ Status     │ Public     │ Actions      │
├──────────────┼──────────┼────────────┼────────────┼────────────┼──────────────┤
│ Free         │ $0       │ 4,415      │ Active     │ ✓          │ Edit Archive │
│ Creator ⭐   │ $19/mo   │ 280        │ Active     │ ✓          │ Edit Archive │
│ Studio       │ $49/mo   │ 132        │ Active     │ ✓          │ Edit Archive │
└──────────────┴──────────┴────────────┴────────────┴────────────┴──────────────┘
```

### Plan Editor (Drawer, 500px wide)

Full plan configuration form:

```
Plan Name: [Creator           ]
Slug: [creator              ]  (auto-generates from name, editable)
Description: [textarea]

─── PRICING ──────────────────────────────────────
Monthly Price: [$  19.00 ]  Annual Price: [$ 190.00 ]
Currency: [USD ▼]
Trial Period: [ 7 ] days

Stripe Price ID (Monthly): [price_xxx]
Stripe Price ID (Annual):  [price_xxx]

─── LIMITS ───────────────────────────────────────
AI Credits / month: [ 500 ]
Storage: [ 20 ] GB
Max Projects: [ -1 ] (-1 = unlimited)
Max Exports / month: [ 100 ] (-1 = unlimited)
Max Collaborators: [ 0 ]
Max File Size: [ 100 ] MB

─── FEATURES ─────────────────────────────────────
[✓] Use Managed API Keys
[✓] Google Drive Storage
[✓] Project Sharing
[✓] Version History
[✓] Priority Support
[  ] API Access
[✓] Advanced Export
[  ] Watermark-free exports

─── MODULES ENABLED ──────────────────────────────
[✓] Chat/AI Director    [✓] Script Generation
[✓] Storyboard          [✓] Image Generation
[✓] Video Generation    [✓] Audio Generation
[✓] Voice-over          [✓] Final Assembly

─── VISIBILITY ───────────────────────────────────
[✓] Active (can be subscribed to)
[✓] Public (shown on pricing page)
Sort order: [ 2 ]

[Cancel]    [Save Plan]
```

---

## 15.7 — Promo Code Management (`/pages/admin/PromoCodes/`)

Route: `/admin/promo-codes`

```
Promo Codes                          [+ Create Code]  [Generate Bulk]

[Status: All ▼]  [Type: All ▼]  [Search code...]

┌──────────────┬───────────────┬────────────┬──────────────┬──────────────────┐
│ Code         │ Discount      │ Redeemed   │ Expires      │ Actions          │
├──────────────┼───────────────┼────────────┼──────────────┼──────────────────┤
│ SAVE30       │ 30% off       │ 142 / ∞    │ Jun 30, 2025 │ Edit Deactivate  │
│ LAUNCH50     │ $5 off        │ 89 / 100   │ May 31, 2025 │ Edit Deactivate  │
│ FREETRIAL7   │ +7 trial days │ 23 / 50    │ No expiry    │ Edit Deactivate  │
└──────────────┴───────────────┴────────────┴──────────────┴──────────────────┘
```

### Promo Code Editor (Drawer)

```
Code: [SAVE30        ]  [Auto-generate]
Description (internal): [30% off for launch campaign]

─── DISCOUNT ─────────────────────────────────────
Type: ○ % Off  ● Fixed $  ○ Trial Days  ○ Free Upgrade

Value: [30  ] %  (for % off)
       [$    ] (for fixed)
       [   ] days (for trial)
       Plan: [Creator ▼] for [30] days (for free upgrade)

─── APPLIES TO ───────────────────────────────────
○ Any plan
● Specific plans: [Creator ▼] [+ Add Plan]

─── LIMITS ───────────────────────────────────────
Max total redemptions: [ 0 ] (0 = unlimited)
Max per user: [ 1 ]

─── DATES ────────────────────────────────────────
Start date: [05/01/2025]
Expiry date: [06/30/2025]  [  ] No expiry

─── OPTIONS ──────────────────────────────────────
[  ] Stackable with other codes
[  ] First-time subscribers only
[  ] Associate with referrer user ID: [__________]

─── SHARING ──────────────────────────────────────
Shareable URL: https://directorbyte.com/signup?promo=SAVE30
[Copy URL]

[Cancel]    [Save Promo Code]
```

### Redemption History (`/admin/promo-codes/:id/redemptions`)

Table: User | Email | Plan | Discount Applied | Date

### Bulk Generate Modal
```
Generate Bulk Codes
Count: [ 50 ]
Prefix: [LAUNCH] ← codes become LAUNCH-XXXX
[... same fields as regular promo code ...]
[Generate 50 Codes]
→ Shows download CSV button after generation
```

---

## 15.8 — API & Services (`/pages/admin/Services/`)

Route: `/admin/services`

Tabs: AI Providers | Payment Gateway | Email | Storage

**AI Providers Tab:**

Grid of service cards:
```
┌───────────────────────────────────────────────────────┐
│ 🧠 Gemini (Google)                    ● Active        │
│ Module: Chat, Image Gen, TTS                          │
│ Key: sk-●●●●●●●●●●●●●●●●  ...a3f2   [Reveal]        │
│ Backup key:  [Not set]                [Set backup]   │
│ Model: gemini-2.0-flash               [Change ▼]     │
│ Monthly cap: $50.00/mo               [Edit]          │
│ Usage: $12.40 of $50.00 (24.8%)                      │
│ Last tested: ✅ 2 hours ago           [Test Now]     │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ 🎬 Runway ML                          ● Active        │
│ Module: Video Generation                              │
│ Key: rk-●●●●●●●●●●●●  ...8b91       [Reveal]        │
│ Model: gen3-turbo                     [Change ▼]     │
│ Usage: 234 API calls · $18.20 this month             │
│ Last tested: ✅ 5 min ago            [Test Now]      │
└───────────────────────────────────────────────────────┘
```

Edit key: inline expand with new key input + save.
Test: shows spinner → ✅ Connected (200ms) or ❌ Error.

**Payment Gateway Tab:**
```
Payment Gateway: [Stripe ▼]
Mode: [● Live  ○ Test]

Stripe Secret Key: [sk_live_●●●●●●●  ...9j4k] [Update]
Webhook Secret:    [whsec_●●●●●●●●●  ...x2z1]
Webhook URL:       https://api.directorbyte.com/api/v1/webhooks/stripe  [Copy]
Webhook Status:    ✅ Receiving events

Last webhook received: 5 min ago (invoice.paid)

[Send test webhook]    [View webhook logs]
```

**Email Tab:**
```
SMTP Configuration:
Host:     [smtp.gmail.com      ]
Port:     [587]
Username: [noreply@directorbyte.com]
Password: [●●●●●●●●●●]      [Update]
From:     [DirectorByte <noreply@directorbyte.com>]
TLS:      [✓ enabled]

[Send test email to: [your@email.com    ] [Send Test]]

Status: ✅ Last email sent 2 hours ago
```

**Storage Tab:**
```
Primary Storage: [Google Cloud Storage ▼]
Bucket: [directorbyte-prod]
Key File: [/path/to/service-account.json] [Update]
Status: ✅ Connected · 142 GB used
```

---

## 15.9 — Content Management (`/pages/admin/Content/`)

Route: `/admin/content`

Tabs: Help Articles | Announcements | Email Templates | Pricing Page

**Help Articles Tab:**
```
[+ New Article]  [+ New Category]

Category tree (left) + Article list (right):

▶ Getting Started (12)
▶ API Keys (8)
▶ Billing (6)
▶ Studio (15)
▶ Troubleshooting (11)

Selected: Getting Started > Articles:
  [Published] Setting up DirectorByte   [Edit] [Unpublish] [Delete]
  [Published] Connecting Google Drive   [Edit] [Unpublish] [Delete]
  [Draft    ] Advanced script settings  [Edit] [Publish  ] [Delete]
```

Article editor (Drawer, full-height):
- Title, slug (auto), category, tags, status
- TipTap rich text editor (full-featured)
- Excerpt field
- Preview button (renders article in modal)
- [Save Draft] / [Publish] buttons

**Announcements Tab:**
```
[+ New Announcement]

Active announcements:
┌──────────────────────────────────────────────────────┐
│ 📣 New Studio module released!         Targets: ALL   │
│    Expires: May 15 · Dismissible: Yes  [Edit] [Stop] │
└──────────────────────────────────────────────────────┘

Scheduled:
┌──────────────────────────────────────────────────────┐
│ 🔧 Maintenance on May 20              Targets: ALL   │
│    Starts: May 20 8am UTC · Persistent [Edit] [Del]  │
└──────────────────────────────────────────────────────┘
```

Announcement editor (Modal):
```
Title: [input]
Body: [TipTap editor]
Type: [INFO | WARNING | SUCCESS | MAINTENANCE ▼]
Target: [All Users | Free Users | Paid Users | Specific Plan | User IDs ▼]
  → If Specific Plan: [Creator ▼]
  → If User IDs: [paste comma-separated IDs]

Dismissible: [✓]  (users can close it)

Schedule:
Start: [05/10/2025  08:00]
Expiry: [05/15/2025 23:59]  [  ] No expiry

[Cancel]  [Save Draft]  [Publish Now]
```

---

## 15.10 — Support Tickets (`/pages/admin/SupportTickets/`)

Route: `/admin/support`

### Inbox View
```
Support Tickets (14 open)

[Status: Open ▼]  [Priority: All ▼]  [Category: All ▼]  [Assigned: All ▼]

┌──────────────────────────────────────────────────────────────────────────┐
│ [🔴 URGENT] #48 Can't access account after password reset                │
│  naviyanka@gmail.com · Creator Plan · 5 min ago · Unread                │
├──────────────────────────────────────────────────────────────────────────┤
│ [🟡 HIGH  ] #47 Video generation keeps failing                           │
│  jane@example.com · Studio Plan · 1 hour ago                            │
├──────────────────────────────────────────────────────────────────────────┤
│ [🔵 NORMAL] #46 Question about promo codes                              │
│  user@test.com · Free Plan · 3 hours ago                                │
└──────────────────────────────────────────────────────────────────────────┘
```

Priority colors: Urgent=red, High=amber, Normal=blue, Low=gray.

### Ticket Detail (`/admin/support/tickets/:id`)

Split view: ticket thread (left 65%) + user info panel (right 35%)

**Thread panel:**
Same conversation display as user-facing ticket view, but:
- Shows ALL messages including internal notes
- Internal notes have distinct styling (amber/gold background, "INTERNAL NOTE" label)
- Reply toolbar has: [Public Reply] / [Internal Note] toggle

**Reply form:**
```
Reply type: [● Public Reply  ○ Internal Note]

[TipTap editor]
[Canned responses ▼]  [📎 Attach]

[Change status: In Progress ▼]  [Send Reply]
```

Canned responses dropdown: shows saved responses, clicking inserts text into editor.

**User info panel (right):**
```
┌────────────────────────────────────────────┐
│ [Avatar] Navi Singh                        │
│ naviyanka@gmail.com                        │
│ Creator Plan · Joined Apr 1               │
│ [View full profile →]                     │
│ [Impersonate user →]                      │
├────────────────────────────────────────────┤
│ TICKET INFO                                │
│ Status: Open        Priority: High        │
│ Category: Technical                       │
│ Opened: May 7, 3:42 PM                   │
│ First response: 4h 22m (SLA: 8h)         │
├────────────────────────────────────────────┤
│ PREVIOUS TICKETS (3)                       │
│ #38 Billing question · Resolved           │
│ #31 Export help · Closed                  │
│ #22 API key issue · Resolved              │
└────────────────────────────────────────────┘
```

### Canned Responses Manager (`/admin/support/canned-responses`)
Table of saved responses.
Create/edit/delete form: Title + Body (TipTap).

### Metrics Dashboard (`/admin/support/metrics`)
- Open tickets by priority (donut chart)
- Avg first response time (30-day trend)
- Resolution rate (30-day trend)
- Ticket volume by category (bar chart)
- SLA breach rate

---

## 15.11 — System Settings (`/pages/admin/SystemSettings/`)

Route: `/admin/settings`

Tabs: General | Security | Feature Flags | Email Templates

**General Tab:**
Form fields for all SystemSetting keys in the General category:
- App name, logo upload, favicon upload
- Support email
- Contact links (Twitter, Discord, etc.)
- Maintenance mode toggle (with confirmation modal + message field)
- Registration: [Open | Invite-only | Closed ▼]

**Security Tab:**
- Max login attempts: [5]
- Lockout duration: [30] minutes
- Session lifetime: [24] hours
- Admin IP allowlist: [textarea, one IP per line]
- Force 2FA for admin: [toggle, grayed out if not implemented yet]

**Feature Flags Tab:**
```
Feature Flags
"Toggle any feature on/off globally without redeploying."

VIDEO GENERATION
[✓] Enable video generation                    [Toggle]
[✓] Runway ML provider                         [Toggle]
[✓] Kling provider                             [Toggle]
[  ] Veo provider (beta)                       [Toggle]

STORAGE
[✓] Google Drive integration                   [Toggle]
[✓] Local storage                              [Toggle]

SUBSCRIPTION
[✓] Subscription system                        [Toggle]
[✓] Promo codes                                [Toggle]
[  ] Referral system (coming soon)             [Toggle — disabled]

ADMIN
[✓] User impersonation                         [Toggle]
[✓] Audit logging                              [Toggle]
```

Each toggle change: shows confirmation modal "Disable video generation?
This will affect all users immediately. Confirm?"

**Email Templates Tab:**
List of all email templates.
Clicking opens the template editor:
- Subject line field
- HTML body (TipTap + raw HTML toggle)
- Variable reference: shows `{{displayName}}`, `{{planName}}`, etc.
- [Send test email] button

---

## 15.12 — Audit Log (`/pages/admin/AuditLog/`)

Route: `/admin/audit`

```
Audit Log                              [Export CSV]

Filters:
[Action: All ▼]  [Admin: All ▼]  [User: search...]  [Date range picker]

┌──────────────────┬─────────┬───────────────────────┬─────────────────────┬────────────┐
│ Timestamp        │ Admin   │ Action                 │ Target              │ IP         │
├──────────────────┼─────────┼───────────────────────┼─────────────────────┼────────────┤
│ May 7, 10:23 AM  │ admin   │ IMPERSONATION_START    │ naviyanka@gmail.com │ 43.x.x.x   │
│ May 7, 09:15 AM  │ admin   │ SUBSCRIPTION_ASSIGNED  │ test@example.com    │ 43.x.x.x   │
│ May 6, 05:42 PM  │ admin   │ PROMO_CREATED          │ Code: SAVE30        │ 43.x.x.x   │
└──────────────────┴─────────┴───────────────────────┴─────────────────────┴────────────┘

Clicking any row → expands to show full JSON `details` object.
```

---

## 15.13 — Completion Criteria

- [ ] Admin login page renders separately, uses amber accent
- [ ] Admin auth works, session stored, `<RequireAdminAuth>` redirects correctly
- [ ] Admin banner shows on all admin pages
- [ ] Admin sidebar renders all nav items with correct ticket badge count
- [ ] Overview KPI cards show real data from API
- [ ] Charts render with correct data and period selector works
- [ ] Recent activity feed refreshes every 30 seconds
- [ ] Users table: search, filter, sort all work
- [ ] Bulk actions: assign plan, suspend, export work on selection
- [ ] User detail view: all 6 tabs load correct data
- [ ] Impersonation opens new tab with correct user session and amber banner
- [ ] Password reset: email and direct set both work
- [ ] Subscription assign modal creates subscription correctly
- [ ] Credit adjust applies and logs to audit log
- [ ] Plans table and editor: create, edit, archive all work
- [ ] Promo code CRUD works, shareable URL displayed
- [ ] Bulk promo code generator creates correct count of codes
- [ ] Redemption history table shows correct data
- [ ] Service cards show masked keys and test connection works
- [ ] Stripe settings save webhook URL displayed correctly
- [ ] Email SMTP save sends test email
- [ ] Feature flags toggle immediately (no deploy needed)
- [ ] Help article rich text editor saves and publishes correctly
- [ ] Announcement editor targets correctly and shows on user app
- [ ] Support inbox shows tickets sorted by urgency
- [ ] Admin reply sends email to user
- [ ] Internal note is invisible to user
- [ ] Canned responses insert into editor
- [ ] System settings general tab saves app name and propagates
- [ ] Maintenance mode toggle shows maintenance page to all users
- [ ] Audit log exports correct CSV with date range filter
- [ ] Zero TypeScript errors
