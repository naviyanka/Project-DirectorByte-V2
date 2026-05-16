# ANTIGRAVITY_GUIDE.md — DirectorByte v2 Master Session Guide
> Paste this at the START of every Antigravity session, then paste the current phase file.

---

## What You Are Building

**DirectorByte v2** — A premium AI Film Generator SaaS platform.

- **Existing codebase (REFERENCE ONLY — never touch):** https://github.com/naviyanka/Project-DirectorByte
- **New codebase directory:** `/directorbyte-v2/` (create as sibling to existing code)
- **Rebuild goal:** Complete modular rewrite with admin center, subscriptions, multi-provider AI, Google Drive storage, support system, and premium UI/UX.

---

## Non-Negotiable Rules (read before every session)

1. **Never touch `/directorbyte-existing/`** — it is read-only reference. All new code goes in `/directorbyte-v2/`.
2. **TypeScript everywhere** — no `.js` files. All new files are `.ts` or `.tsx`.
3. **No hardcoded values** — colors use design tokens, config uses env vars, limits come from DB/plan config.
4. **No spaghetti** — every module is independently understandable. No circular imports.
5. **Complete the checklist** — every phase has a `Completion Criteria` section. Do not call a phase done until every checkbox is checked.
6. **Fix forward** — if you discover a gap from a previous phase, note it in a comment and fix it in the current phase. Do not go back and rewrite completed phases.
7. **UI must match the design references** — no generic Material UI defaults, no Bootstrap look. Study these before any frontend phase:
   - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
   - https://www.uupm.cc/
8. **Mobile first** — every screen must work at 375px width.

---

## Session Starter Template

Copy this block, fill in the phase number and name, then paste the full phase `.md` file content below it:

```
You are rebuilding DirectorByte, an AI Film Generator SaaS platform, from scratch.

CONTEXT:
- Existing codebase (reference only, DO NOT touch): https://github.com/naviyanka/Project-DirectorByte
- New codebase directory: /directorbyte-v2/
- All phases up to Phase [N-1] are complete.

CURRENT TASK: Phase [N] — [Phase Name]

RULES (non-negotiable):
1. Only write code in /directorbyte-v2/
2. TypeScript everywhere — no .js files
3. No hardcoded values — use env vars, design tokens, and DB config
4. Complete ALL checklist items before declaring the phase done
5. If you find a missing dependency from a prior phase, note it with a // TODO comment and keep going
6. UI/UX: study https://github.com/nextlevelbuilder/ui-ux-pro-max-skill and https://www.uupm.cc/ before writing any component

PHASE INSTRUCTION:
[paste full phase .md content here]
```

---

## Phase Status Tracker

Update this table as phases are completed. Share this tracker with Antigravity at the start of each session so it knows what's done.

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 00 | Codebase Analysis | [x] Completed | |
| 01 | Architecture & Directory Structure | [x] Completed | |
| 02 | Database Schema & Migrations | [x] Completed | |
| 03 | Backend Core (Auth, Middleware, Email) | [x] Completed | Skipped Redis, BullMQ, Google OAuth |
| 04 | Backend: Users, Projects, API Keys | ☐ Not started | |
| 05 | Backend: Subscriptions & Payments | ☐ Not started | |
| 06 | Backend: Admin API | ☐ Not started | |
| 07 | Backend: Support, Jobs, Notifications | ☐ Not started | |
| 07B | Backend: Video & Audio AI Providers | ☐ Not started | |
| 08 | Frontend: Design System & Components | ☐ Not started | |
| 09 | Frontend: Auth & Onboarding | ☐ Not started | |
| 10 | Frontend: Home Dashboard | ☐ Not started | |
| 11 | Frontend: Studio Pipeline | ☐ Not started | |
| 12 | Frontend: Settings | ☐ Not started | |
| 13 | Frontend: Subscription & Pricing | ☐ Not started | |
| 14 | Frontend: Support Center | ☐ Not started | |
| 15 | Frontend: Admin Center | ☐ Not started | |
| 16 | Integration | ☐ Not started | |
| 17 | Polish, Responsive, Accessibility | ☐ Not started | |
| 18 | Testing (Vitest, Playwright, CI) | ☐ Not started | |
| 18B | Landing / Marketing Page | ☐ Not started | |
| 19 | Documentation | ☐ Not started | |

---

## Key Design Decisions (for Antigravity to remember)

### Tech Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS v4 + Zustand + React Query + Radix UI + Framer Motion
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis + BullMQ
- **Auth:** JWT (access 15min + refresh 30d) + Google OAuth
- **Email:** Nodemailer SMTP + BullMQ queue
- **Storage:** GCS (paid) / Google Drive (user OAuth) / local
- **Payments:** Stripe (primary gateway, abstracted behind interface)
- **Logging:** Pino structured JSON

### Directory Layout
```
/directorbyte-v2/
  backend/        ← Express API server
  frontend/       ← React (Vite) app
  shared/         ← Shared TypeScript types
  docs/           ← Generated documentation
```

### API conventions
- All routes versioned at `/api/v1/`
- All responses: `{ success: bool, data: T }` or `{ success: false, error: { code, message, fields? } }`
- Auth: `Authorization: Bearer <accessToken>` header
- Admin auth: `X-Admin-Token: <adminSessionToken>` header

### Design Visual Identity
- Base: dark mode cinema-grade (`#0D0D0F`)
- Accent: electric violet/indigo (`#8B5CF6`)
- Feel: premium creative software (Runway ML, Pika, Adobe — not generic SaaS)
- Typography: Inter (UI) + JetBrains Mono (code)
- Admin accent: amber/gold (distinct from user-facing violet)

---

## Files in This Plan (in order)

```
ANTIGRAVITY_GUIDE.md        ← You are reading this
MASTER_PLAN.md              ← High-level phase overview table
PHASE_00_ANALYSIS.md
PHASE_01_ARCHITECTURE.md
PHASE_02_DATABASE.md
PHASE_03_BACKEND_CORE.md
PHASE_04_BACKEND_USERS.md
PHASE_05_BACKEND_SUBSCRIPTIONS.md
PHASE_06_BACKEND_ADMIN.md
PHASE_07_BACKEND_SUPPORT.md
PHASE_07B_AI_PROVIDERS.md   ← Video/audio providers (RunwayML, Kling, Pika, Suno, ElevenLabs)
PHASE_08_FRONTEND_FOUNDATION.md
PHASE_09_FRONTEND_AUTH.md
PHASE_10_FRONTEND_HOME.md
PHASE_11_FRONTEND_STUDIO.md
PHASE_12_FRONTEND_SETTINGS.md
PHASE_13_FRONTEND_SUBSCRIPTION.md
PHASE_14_FRONTEND_SUPPORT.md
PHASE_15_ADMIN_CENTER.md
PHASE_16_INTEGRATION.md
PHASE_17_POLISH.md
PHASE_18_TESTING.md         ← Vitest, Playwright, GitHub Actions CI
PHASE_18B_LANDING_PAGE.md   ← Public marketing landing page
PHASE_19_DOCS.md
ADDENDUM_01_FIXES.md        ← Missing models, routes, env vars (apply alongside Phase 02/04/06)
REVIEW_AND_GAPS.md          ← Full gap analysis (reference only)
```

---

## Recommended GitHub Workflow

1. Create a private repo: `directorbyte-v2-plan`
2. Commit all `.md` phase files to it
3. At the start of each session: share `ANTIGRAVITY_GUIDE.md` + the current phase file
4. After completing a phase: update the Status Tracker table in this file and commit
5. Keep a `PROGRESS.md` file in the repo logging what was built each session

This keeps the entire plan version-controlled, shareable, and resumable at any point.
