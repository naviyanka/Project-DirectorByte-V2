# PHASE 10 — Frontend: Home Dashboard & Project Manager
> DirectorByte Rebuild · Depends on: PHASE_09 (Auth Complete)

---

## Objective

Build the main home dashboard and project management experience.
This is the hub users land on after every login — it must communicate
project status, usage, and actions at a glance without feeling cluttered.

All pages use `AppLayout` (Sidebar + Topbar) from Phase 08.

---

## 10.1 — Home Page (`/pages/home/Home/`)

Route: `/home`

### Page structure (3-column grid on desktop, stacked on mobile)
```
┌──────────────────────────────────────────────────────────┐
│  Welcome back, [Name] 👋    [+ New Project]              │
│  [day], [date]                                           │
├─────────────────────┬──────────────────┬─────────────────┤
│  Recent Projects    │  Usage Summary   │  Quick Actions  │
│  (main, 60%)        │  (side, 25%)     │  (side, 15%)    │
├─────────────────────┴──────────────────┴─────────────────┤
│  Announcements strip (if any active)                     │
├──────────────────────────────────────────────────────────┤
│  Continue where you left off  [last active project card] │
└──────────────────────────────────────────────────────────┘
```

### 10.1.1 — Welcome Header

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar 40px]  Welcome back, Navi  ·  Wednesday, May 7 │
│                 [Creator Plan badge]                    │
│                                                [+ New Project] button │
└─────────────────────────────────────────────────────────┘
```

Time-aware greeting:
- 5am–12pm: "Good morning"
- 12pm–5pm: "Good afternoon"
- 5pm–9pm: "Good evening"
- 9pm–5am: "Working late?"

`+ New Project` button: primary, opens `<NewProjectModal>`

### 10.1.2 — Continue Where You Left Off

Shown only if user has at least one project in progress.
Full-width horizontal card, pinned below header.

```
┌─────────────────────────────────────────────────────────┐
│ [Thumbnail 80x80]  [Project Title]                      │
│                    Stage: Keyframe Generation           │
│                    Last edited 2 hours ago              │
│                    ████████░░░░  Stage 3 of 7          │
│                                     [Continue →] button │
└─────────────────────────────────────────────────────────┘
```

### 10.1.3 — Recent Projects Grid

Show last 8 projects in a responsive grid (4 col desktop, 2 col tablet, 1 col mobile).
"View all projects" link → `/projects`

Each project card:
```
┌────────────────────┐
│ [Thumbnail 16:9]   │  ← colored gradient if no thumbnail
│ ┌──────────────┐   │
│ │ STATUS badge │   │  ← In Progress / Completed / Draft
│ └──────────────┘   │
├────────────────────┤
│ Project Title      │
│ Last edited: 2h ago│
│ Stage: Storyboard  │
│ ┌──────────────────┤
│ │ ··· (menu icon)  │  ← hover to show actions
└─┴──────────────────┘
```

Project card hover state:
- Slight lift (translateY -2px)
- Border brightens to --border-strong
- Action menu dots appear
- Cursor: pointer

Project card menu (DropdownMenu):
- Open project
- Rename
- Duplicate
- Share / Stop sharing
- Archive
- Delete (destructive, with confirm)

Empty state (no projects yet):
```
[Film reel illustration — custom SVG]
"No projects yet"
"Start your first AI film in seconds."
[+ Create your first project]  ← primary button
```

### 10.1.4 — Usage Summary Widget

Side panel card showing current plan's usage.

```
┌──────────────────────────────┐
│ Creator Plan  [Upgrade →]    │
│ Renews May 31                │
├──────────────────────────────┤
│ AI Credits                   │
│ ████████░░░░  380 / 500     │
│ 76% used                     │
├──────────────────────────────┤
│ Storage                      │
│ ████░░░░░░░░  8.2 / 20 GB   │
│ 41% used                     │
├──────────────────────────────┤
│ Projects                     │
│ ██████████░░  ∞ (unlimited)  │
├──────────────────────────────┤
│ Exports this month           │
│ ████████████  42 / 100      │
│ 42% used                     │
└──────────────────────────────┘
```

Color-code progress bars (from design system ProgressBar component):
- <80%: brand violet
- 80-94%: warning amber
- 95-100%: danger red

When any meter hits 80%: show warning icon + "Running low" label.
When at 100%: show red + "Limit reached. [Upgrade]" link.

### 10.1.5 — Quick Actions Tile Grid

Side panel card below usage widget.

```
┌──────────────────────────────┐
│ Quick Actions                │
├──────────────────────────────┤
│ [🎬] New Project             │
│ [📝] Script Generator        │
│ [🖼️] Keyframe Studio        │
│ [🎵] Audio Generator         │
│ [⚙️] Manage API Keys         │
│ [📦] View Storage            │
└──────────────────────────────┘
```

Each tile: icon + label, full-width, hover → surface-300 background.
Icons should be Lucide icons with brand color.

### 10.1.6 — Announcements Strip

Shown between header and projects grid if any active announcements exist.
Fetched from `GET /api/v1/announcements`.

Each announcement:
```
[INFO|WARNING|SUCCESS icon]  [Title] — [short body]   [×] dismiss
```

Colors by type:
- INFO: --color-info-bg / --color-info border
- WARNING: --color-warning-bg / --color-warning border
- SUCCESS: --color-success-bg / --color-success border

Dismissible announcements: clicking × calls dismiss, hides locally.
Non-dismissible: no × button, always visible until expired.
Max 2 announcements shown at once (most recent first).

---

## 10.2 — New Project Modal (`/components/NewProjectModal/`)

Triggered from `+ New Project` button.
Modal size: md (560px).

```
Modal Header: "New Project"

─── Step 1: Basic Details ──────────────────────────
Project Title *
  Input, placeholder: "My Film Project"
  autoFocus, maxLength: 100

Description (optional)
  Textarea, 3 rows, maxLength: 500, character counter

─── Step 2: Film Settings ──────────────────────────
Genre
  Select: Drama | Comedy | Thriller | Sci-Fi | Fantasy |
          Documentary | Romance | Horror | Action | Other

Style
  Select: Cinematic | Animated | Realistic | Stylized |
          Vintage | Modern | Experimental

Target Duration
  Select: Short (< 1 min) | Medium (1-5 min) |
          Long (5-15 min) | Feature (> 15 min)

─── Step 3: Pipeline (optional) ────────────────────
"Which stages do you want to include?"
Checkboxes (all checked by default):
  [✓] Script / Story
  [✓] Storyboard / Keyframes
  [✓] Image Generation
  [✓] Video Generation
  [✓] Audio / Music
  [✓] Voice-over
  [✓] Final Assembly

"You can change this later in the project."

─── Footer ─────────────────────────────────────────
[Cancel]  [Create Project →]
  - Creates project via API
  - Navigates to /studio/[projectId]
  - Shows loading state on button
```

---

## 10.3 — Projects Page (`/pages/home/Projects/`)

Route: `/projects`
Full project management view — more detailed than the home preview.

### Filter bar
```
[Search: search projects...]  [Status: All ▼]  [Sort: Last edited ▼]
```

Status filter options: All / Draft / In Progress / Completed / Archived

Sort options: Last edited / Date created / Title (A-Z) / Title (Z-A)

### Projects grid / list toggle
Toggle between grid view (cards) and list view (table rows) — saved preference.

Grid view: same cards as home but shows all projects with pagination.
List view:
```
| Thumbnail | Title        | Status      | Stage      | Last Edited | Actions |
|-----------|--------------|-------------|------------|-------------|---------|
| [16:9 sm] | My Film 01   | In Progress | Storyboard | 2 hours ago | ···     |
```

### Pagination
Load more button at bottom (not infinite scroll — explicit user action).
"Showing 12 of 47 projects" count.

### Empty state per filter
- All, empty: "No projects yet" (same as home)
- Filtered, no results: "No projects match your filters" + [Clear filters]
- Archived, empty: "No archived projects"

### Bulk operations
Checkbox on each card/row (appears on hover in grid, always visible in list).
When any selected: bulk action bar appears at bottom of screen:
```
[X selected]  [Archive selected]  [Delete selected]  [×  Clear selection]
```
Bulk delete: confirmation modal listing project names.

---

## 10.4 — Project Detail Sidebar Preview

Clicking a project card opens a detail sidebar (slides in from right, 400px).
This is NOT full navigation — it's a quick-view panel.

```
┌────────────────────────────────────────────────────────┐
│ [×]  My Film Project                                   │
├────────────────────────────────────────────────────────┤
│ [Thumbnail 16:9 full width]                            │
├────────────────────────────────────────────────────────┤
│ Status: In Progress    Stage: Storyboard               │
│ Created: May 1, 2025   Last edit: 2 hours ago          │
│ Storage: 142 MB        Pipeline: 7 stages              │
├────────────────────────────────────────────────────────┤
│ Pipeline Progress:                                      │
│ ✓ Script    ✓ Keyframes    ○ Images    ○ Video         │
│ ○ Audio     ○ Voice-over   ○ Assembly                  │
├────────────────────────────────────────────────────────┤
│ [Open Project]  [Duplicate]  [Share]  [Archive]        │
└────────────────────────────────────────────────────────┘
```

Opening project: navigates to `/studio/[projectId]`.

---

## 10.5 — Sidebar Navigation (`/layouts/Sidebar/`)

This is the main app sidebar, present on all non-studio pages.

```
┌──────────────────────────┐
│ ◈ DirectorByte           │  ← Logo + name (collapses to icon)
├──────────────────────────┤
│ 🏠 Home                  │
│ 📁 Projects              │
├── STUDIO ────────────────┤
│ 🎬 New Project           │
│ 📝 Script                │
│ 🖼️ Storyboard            │
│ 🎞️ Video                 │
│ 🎵 Audio                 │
├── ACCOUNT ───────────────┤
│ ⚙️ Settings              │
│ 💳 Subscription          │
│ ❓ Support               │
├──────────────────────────┤
│ [Avatar] Navi            │  ← bottom
│ Creator Plan             │
│ v2.0.0                  │
└──────────────────────────┘
```

Active item: left border brand color + subtle brand background tint.
Collapse state: icons only, tooltips on hover showing labels.
Mobile: drawer (full overlay sidebar with backdrop).

Sidebar toggle: hamburger icon in Topbar. State in ui.store.ts.

---

## 10.6 — Topbar (`/layouts/Topbar/`)

```
┌──────────────────────────────────────────────────────┐
│ [≡]  Home                    [⌘K]  [🔔]  [Avatar ▼] │
└──────────────────────────────────────────────────────┘
```

Left side:
- Sidebar toggle button
- Breadcrumb (auto-generated from current route):
  - Home → "Home"
  - /projects → "Projects"
  - /studio/ID → "Studio / [Project Name]"

Right side:
- Search button (Cmd+K shortcut, opens global search modal)
- Notification bell (with unread badge count)
- User avatar dropdown:
  ```
  [Avatar + Name]
  [Plan badge]
  ─────────────
  Profile & Settings
  Subscription
  ─────────────
  Support
  ─────────────
  Sign out
  ```

---

## 10.7 — Notification Panel

Opened by clicking topbar bell. Slides in from right (not full navigation).

```
┌──────────────────────────────────────────────────┐
│ Notifications            [Mark all read]  [×]    │
├──────────────────────────────────────────────────┤
│ 🔔 NEW                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ ✅ Generation Complete                       │ │
│ │ "My Film Project" video generation done      │ │
│ │ 5 min ago                    [View Project] │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ 💳 Subscription Renewing                    │ │
│ │ Creator plan renews in 7 days ($19.00)      │ │
│ │ Yesterday                   [Manage Plan]  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ EARLIER                                          │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🎟️ Support Reply                            │ │
│ │ Admin replied to ticket #42                 │ │
│ │ 3 days ago                  [View Ticket]  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [See all notifications →]                        │
└──────────────────────────────────────────────────┘
```

- Unread notifications: slightly brighter background
- Polling every 30 seconds via React Query
- Mark individual notification read: clicking it
- Notification types have distinct icons + colors
- Empty state: "All caught up! Nothing new." + checkmark illustration

---

## 10.8 — Global Search Modal (`/components/GlobalSearch/`)

Triggered by Cmd+K or topbar search button.

```
┌──────────────────────────────────────────────────┐
│ [🔍] Search projects, docs, settings...          │
│                                          [Esc]   │
├──────────────────────────────────────────────────┤
│ RECENT                                           │
│ › My Film Project 01        In Progress          │
│ › Sci-Fi Short               Completed           │
├──────────────────────────────────────────────────┤
│ QUICK ACTIONS                                    │
│ ⚡ New Project                                   │
│ ⚙️ Go to Settings                               │
│ 💳 Manage Subscription                          │
└──────────────────────────────────────────────────┘
```

While typing:
```
┌──────────────────────────────────────────────────┐
│ [🔍] my film                              [Esc]  │
├──────────────────────────────────────────────────┤
│ PROJECTS                                         │
│ 📁 My Film Project 01        In Progress         │
│ 📁 My First Film             Completed           │
├──────────────────────────────────────────────────┤
│ HELP ARTICLES                                    │
│ ❓ How to add subtitles to my film               │
│ ❓ Film export formats explained                 │
└──────────────────────────────────────────────────┘
```

Keyboard navigation:
- Arrow up/down: move selection
- Enter: navigate to selected item
- Esc: close modal
- Cmd+K while open: close

---

## 10.9 — Completion Criteria

- [ ] Home page loads with welcome header, time-aware greeting
- [ ] "Continue where left off" card shows correct last project
- [ ] Recent projects grid shows last 8, with correct status badges
- [ ] Project card hover shows action menu
- [ ] All project card actions work (rename, duplicate, archive, delete)
- [ ] Usage widget shows correct numbers from API with colored bars
- [ ] Warning state at 80% and danger state at 95% display correctly
- [ ] Announcements strip shows/hides based on active announcements
- [ ] Dismissing an announcement hides it permanently for that user
- [ ] New Project modal opens, validates, creates project, navigates to studio
- [ ] Projects page shows all projects with filter and sort working
- [ ] Grid/list toggle works and persists preference
- [ ] Bulk selection and bulk delete/archive work
- [ ] Project sidebar slides in on card click with correct data
- [ ] Sidebar collapses to icon-only on toggle
- [ ] Sidebar becomes drawer on mobile (< 768px)
- [ ] Topbar breadcrumb updates on every route change
- [ ] Notification panel polls every 30 seconds
- [ ] Notification mark-read works individually and bulk
- [ ] Global search opens with Cmd+K, searches projects + help articles
- [ ] Keyboard navigation works in search modal
- [ ] Zero TypeScript errors
