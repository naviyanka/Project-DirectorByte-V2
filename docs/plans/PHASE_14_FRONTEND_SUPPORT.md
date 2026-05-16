# PHASE 14 — Frontend: Support Center
> DirectorByte Rebuild · Depends on: PHASE_13 (Subscription Complete)

---

## Objective

Build the complete user-facing support experience: searchable help center,
support ticket submission, ticket thread view, and system status display.
Support should feel responsive and human — not like a dead-end.

---

## 14.1 — Support Center Home (`/pages/support/SupportHome/`)

Route: `/support`

### Layout
Full AppLayout (sidebar + topbar).

```
┌───────────────────────────────────────────────────────────────────┐
│  Support Center                                                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  How can we help you?                                       │ │
│  │  [🔍  Search for answers...                              ]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  POPULAR ARTICLES                                                 │
│  [Article card] [Article card] [Article card]                    │
│                                                                   │
│  BROWSE BY CATEGORY                                               │
│  [Category card] [Category card] [Category card] [Category card] │
│                                                                   │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐  │
│  │  My Tickets                 │  │  System Status            │  │
│  │  2 open tickets             │  │  ✅ All systems normal   │  │
│  │  [View all →]               │  │  [Status page →]         │  │
│  └──────────────────────────────┘  └──────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Search bar
Full-width, prominent, autoFocus on page load.
Calls `GET /api/v1/help/search?q=...` as user types (debounced 300ms).

Search results dropdown (inline below search bar):
```
┌─────────────────────────────────────────────────────────┐
│ RESULTS FOR "api key"                                   │
│                                                         │
│ 📄 How to add your own API keys          Getting Started │
│ 📄 API key validation errors             Troubleshooting │
│ 📄 Which providers work with each module API Keys       │
│ 📄 Managing API keys from admin          Admin Guide     │
│                                                         │
│ [See all 12 results →]                                  │
└─────────────────────────────────────────────────────────┘
```

### Category Cards
Grid, 2 columns on mobile / 4 on desktop.
Data from `GET /api/v1/help/categories`.

```
┌─────────────────────┐
│ 🚀                  │
│ Getting Started     │
│ 12 articles         │
└─────────────────────┘
```

Categories: Getting Started / API Keys / Billing / Studio / Troubleshooting / Account

### Quick Actions Row
Below categories:
```
[📨 Submit a Ticket]    [📋 View My Tickets]    [🔗 Status Page]
```

---

## 14.2 — Help Article Browser (`/pages/support/HelpCategory/`)

Route: `/support/category/:slug`

```
[← Support]

📁 Getting Started
12 articles · Updated May 2025

┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Search within this category...]                             │
└─────────────────────────────────────────────────────────────────┘

Article list:

┌─────────────────────────────────────────────────────────────────┐
│ 📄 Setting up DirectorByte for the first time                   │
│    Learn how to connect your API keys and start your first      │
│    project in under 5 minutes.                                  │
│    👁 1,240 views  ·  👍 94%  ·  Updated 3 days ago  [Read →]  │
├─────────────────────────────────────────────────────────────────┤
│ 📄 How to connect Google Drive                                  │
│    Store your projects directly in your Google Drive...         │
│    👁 820 views  ·  👍 91%  ·  Updated 1 week ago   [Read →]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14.3 — Help Article View (`/pages/support/HelpArticle/`)

Route: `/support/article/:slug`

```
[← Getting Started]

Setting up DirectorByte for the first time
Updated May 5, 2025 · 5 min read

─── TABLE OF CONTENTS ────────────────────────────────────────────
1. Create your account
2. Set up your API keys
3. Create your first project
4. Export your film
──────────────────────────────────────────────────────────────────

[Full article rich text content]

Includes:
- Headers with anchor links
- Inline code blocks (styled with CodeBlock component)
- Images with captions
- Info callout boxes
- Step-numbered lists

──────────────────────────────────────────────────────────────────

Was this article helpful?

[👍 Yes, helpful]    [👎 No, not helpful]

After voting:
  If yes: "Thanks! Glad it helped. 😊"
  If no:  "Sorry to hear that. [Submit a support ticket →]"

──────────────────────────────────────────────────────────────────

RELATED ARTICLES
📄 How to add your own API keys
📄 Understanding AI credit usage
📄 Exporting your first film
```

Article content uses the design system typography exactly.
Code blocks use --font-mono.
Callout boxes use semantic colors from design tokens.

---

## 14.4 — Search Results Page (`/pages/support/SearchResults/`)

Route: `/support/search?q=api+key`

```
Results for "api key"
12 articles found

[Filters: All | Getting Started | API Keys | Billing | ...]

┌─────────────────────────────────────────────────────────────────┐
│ 📄 How to add your own API keys                   API Keys     │
│    Learn how to obtain and configure API keys for each studio  │
│    module including Gemini, OpenAI, and Stable Diffusion.      │
│    👁 1,240 views  ·  Updated 3 days ago                [Read →]│
├─────────────────────────────────────────────────────────────────┤
│ 📄 API key validation errors                  Troubleshooting  │
│    Common errors when testing your API keys and how to fix them │
│    👁 580 views  ·  Updated 1 week ago                 [Read →]│
└─────────────────────────────────────────────────────────────────┘

No results state:
[Magnifying glass illustration]
"No articles match 'your search'"
"Try broader terms, or submit a ticket and we'll help."
[Submit a ticket →]
```

---

## 14.5 — Ticket Submission (`/pages/support/NewTicket/`)

Route: `/support/tickets/new`

```
Submit a Support Ticket

[← Back to Support]

─────────────────────────────────────────────────────────────────

Subject *
[input, maxLength: 200]

Category *
[Select: Billing | Technical | Account | Feature Request | Other]

Priority
[Select: Normal (default) | High | Urgent]
Note: Urgent reserved for account access issues or data loss only.

Message *
[TipTap rich text editor, min 20 chars]

Attachments (optional)
[Drag & drop zone OR browse files]
"Accepted: JPG, PNG, GIF, PDF, MP4, ZIP — max 20MB per file, 5 files max"
[Attached file chips with remove × button]

─────────────────────────────────────────────────────────────────

💡 Before submitting, try:
[🔍 Search help articles for "subject"]  ← updates as user types subject
"Getting started guide →"  "API key setup →"  "Billing FAQ →"

─────────────────────────────────────────────────────────────────

[Cancel]    [Submit Ticket]
  - Loading: "Submitting..."
  - Success: navigate to ticket detail page
```

### Smart article suggestions
As user types in Subject field, show relevant article links below.
Debounced API call to search articles. Shows up to 3 suggestions.
If user clicks suggestion and resolves issue: "Did this solve your issue?" prompt
to avoid submitting unnecessary ticket.

---

## 14.6 — My Tickets List (`/pages/support/MyTickets/`)

Route: `/support/tickets`

```
My Support Tickets           [+ New Ticket]

[Filters: All | Open | In Progress | Waiting for Reply | Resolved | Closed]

┌─────────────────────────────────────────────────────────────────┐
│ #42  Video generation not working                     OPEN     │
│      Submitted May 5 · Last reply: 2 hours ago (Admin)         │
│      Category: Technical · Priority: High               [→]   │
├─────────────────────────────────────────────────────────────────┤
│ #38  Billing question                           WAITING REPLY  │
│      Submitted Apr 28 · Last reply: 3 days ago (You)           │
│      Category: Billing · Priority: Normal               [→]   │
├─────────────────────────────────────────────────────────────────┤
│ #31  How to export to GIF                           RESOLVED  │
│      Submitted Apr 20 · Closed Apr 21                          │
│      Category: Technical · Priority: Normal             [→]   │
└─────────────────────────────────────────────────────────────────┘

Showing 3 of 3 tickets
```

Status badge colors:
- OPEN: --color-info
- IN_PROGRESS: --color-brand-400
- WAITING_USER: --color-warning (you need to reply)
- RESOLVED: --color-success
- CLOSED: --color-text-tertiary (muted)

Empty state (no tickets):
```
[Ticket illustration]
"No tickets yet"
"Have a question or issue? We're here to help."
[Submit your first ticket →]
```

---

## 14.7 — Ticket Thread View (`/pages/support/TicketDetail/`)

Route: `/support/tickets/:id`

```
[← My Tickets]

Ticket #42 · Video generation not working
┌─────────────────────────────────────────────────────────────────┐
│ Status: OPEN  Priority: High  Category: Technical              │
│ Opened: May 5, 2025 · Last activity: 2 hours ago               │
│                              [Close Ticket]  (if not closed)   │
└─────────────────────────────────────────────────────────────────┘

─── CONVERSATION ──────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ 🧑  You · May 5, 2025 at 3:42 PM                               │
│                                                                 │
│ Hi, I'm trying to generate a video using Runway ML but getting  │
│ the error "provider unavailable". I've verified my API key is   │
│ correct. Screenshot attached.                                   │
│                                                                 │
│ [📎 screenshot.png ↓]                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 👤  Support Team · May 6, 2025 at 9:15 AM                      │
│                                                                 │
│ Hi! Thanks for reaching out. We've been experiencing intermittent│
│ issues with the Runway ML integration. Our team is working on a  │
│ fix, expected resolution by today EOD. In the meantime, you can  │
│ try Kling as an alternative provider.                           │
│                                                                 │
│ Let us know if that helps!                                      │
└─────────────────────────────────────────────────────────────────┘

─── REPLY ────────────────────────────────────────────────────────

[TipTap editor, min-height 100px]
[📎 Attach files]   [Submit Reply]
```

Messages sorted oldest-to-newest (conversation thread style).
Auto-scroll to bottom on load.
New reply by admin: real-time (or polling every 60 seconds) update badge in topbar.

Ticket status updates shown as system messages:
```
─── ✅ Admin marked this as RESOLVED · May 7 ───
```

---

## 14.8 — System Status Widget

Shown in Support Home sidebar and as a small indicator in the app footer.
Fetches from `GET /api/v1/health`.

```
System Status
┌─────────────────────────────┐
│ ✅ All systems operational  │
│                             │
│ API            ✅ Online    │
│ Video Gen      ✅ Online    │
│ Storage        ✅ Online    │
│ Payments       ✅ Online    │
│                             │
│ Last checked: 2 min ago     │
│ [View status page →]        │
└─────────────────────────────┘
```

If any service degraded:
```
⚠️ Partial outage detected
Video Generation is experiencing delays.
```

If maintenance mode active:
```
🔧 Scheduled maintenance
We'll be back online at 3:00 AM UTC.
```

---

## 14.9 — Completion Criteria

- [ ] Support home renders with search, categories, and quick actions
- [ ] Search debounces correctly, shows live dropdown results
- [ ] Category page lists all articles with view count and helpfulness score
- [ ] Article page renders rich content including code blocks and callouts
- [ ] Article helpful/not helpful voting works and persists
- [ ] Search results page shows ranked results with category filter
- [ ] Empty search results show correct CTA
- [ ] New ticket form: all fields validate before submit
- [ ] File attachment upload works with progress indicator
- [ ] Smart article suggestions appear as user types subject
- [ ] Ticket list shows correct status badges and last-reply info
- [ ] Filter by status works
- [ ] Ticket thread shows messages in chronological order
- [ ] Attachment images in thread are downloadable/viewable
- [ ] Reply form submits and new message appears immediately
- [ ] Close ticket button works, updates status badge
- [ ] System status widget shows real health data
- [ ] Degraded state shows correct service name
- [ ] Zero TypeScript errors
