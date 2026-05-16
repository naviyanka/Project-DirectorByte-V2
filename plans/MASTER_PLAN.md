# DirectorByte — Master Rebuild Plan
> AI Film Generator Platform · Full Redesign & Feature Expansion
> Repository: https://github.com/naviyanka/Project-DirectorByte

---

## How to Use These Files with Antigravity

Each phase is a standalone instruction file. Feed them to Antigravity **one at a time, in order**.
At the start of each session, paste this into Antigravity:

```
Context: We are rebuilding DirectorByte, an AI Film Generator.
Existing codebase: https://github.com/naviyanka/Project-DirectorByte
New codebase target directory: /directorbyte-v2/ (sibling to existing code — DO NOT touch existing files)
Current phase: [PHASE NAME]
Instruction file: [paste phase file content]
```

Do not skip phases. Each phase depends on the previous.

---

## Phase Overview

| # | File | Focus | Depends On |
|---|------|--------|------------|
| 00 | PHASE_00_ANALYSIS.md | Analyze existing codebase, map features, create inventory | None |
| 01 | PHASE_01_ARCHITECTURE.md | Scaffold full directory structure, configs, env setup | 00 |
| 02 | PHASE_02_DATABASE.md | All DB models, schema, migrations, seed data | 01 |
| 03 | PHASE_03_BACKEND_CORE.md | Config, middleware, auth system, email, logging | 02 |
| 04 | PHASE_04_BACKEND_USERS.md | User CRUD, profile, API key manager, storage, projects | 03 |
| 05 | PHASE_05_BACKEND_SUBSCRIPTIONS.md | Plans, billing, promo codes, payment gateway, webhooks | 04 |
| 06 | PHASE_06_BACKEND_ADMIN.md | All admin API routes, impersonation, audit log, system settings | 05 |
| 07 | PHASE_07_BACKEND_SUPPORT.md | Support tickets, help content API, notifications, background jobs | 06 |
| 08 | PHASE_08_FRONTEND_FOUNDATION.md | Design system, tokens, global components, layout shell | 07 |
| 09 | PHASE_09_FRONTEND_AUTH.md | Sign in, sign up, Google OAuth, onboarding flow | 08 |
| 10 | PHASE_10_FRONTEND_HOME.md | Home dashboard, project manager, navigation | 09 |
| 11 | PHASE_11_FRONTEND_STUDIO.md | Full studio pipeline: script→keyframe→video→audio→export | 10 |
| 12 | PHASE_12_FRONTEND_SETTINGS.md | User settings: profile, API keys, storage, preferences | 11 |
| 13 | PHASE_13_FRONTEND_SUBSCRIPTION.md | Pricing page, checkout, promo codes, billing history | 12 |
| 14 | PHASE_14_FRONTEND_SUPPORT.md | Help center, ticket system, contact, status page | 13 |
| 15 | PHASE_15_ADMIN_CENTER.md | Full admin center frontend: all panels and dashboards | 14 |
| 16 | PHASE_16_INTEGRATION.md | Wire frontend↔backend, Google OAuth+Drive, AI providers | 15 |
| 17 | PHASE_17_POLISH.md | Animations, responsive design, accessibility, error states | 16 |
| 18 | PHASE_18_DOCS.md | README, MODULES.md, ADMIN_GUIDE.md, API reference | 17 |

---

## UI/UX Design References (Mandatory for all frontend phases)

Antigravity MUST study these before generating any UI:

- **UI/UX Pro Max Skill**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **UUPM Design Gallery**: https://www.uupm.cc/

Design principles to extract from these references:
- High-fidelity, production-quality interfaces — never generic or template-like
- Rich micro-interactions and purposeful motion
- Deep visual hierarchy with contrast, spacing rhythm, and type scale
- Dark mode as a first-class experience, not an afterthought
- Component-level polish: every button, input, card, modal must feel crafted
- Data-dense layouts that remain legible and uncluttered
- Distinctive visual identity — DirectorByte should feel like premium creative software

---

## Tech Stack Decisions (to be confirmed in Phase 00)

### Frontend
- Framework: React (Vite) or Next.js App Router
- Styling: Tailwind CSS v4 + CSS custom properties
- State: Zustand (global) + React Query (server state)
- UI components: Radix UI primitives + custom design system
- Animation: Framer Motion
- Icons: Lucide React
- Forms: React Hook Form + Zod
- Rich text: TipTap

### Backend
- Runtime: Node.js (Express or Fastify)
- Language: TypeScript throughout
- ORM: Prisma
- Database: PostgreSQL
- Cache: Redis
- Auth: JWT (access + refresh token pair)
- File storage: Google Cloud Storage (paid) / Google Drive (user OAuth) / Local
- Queue: BullMQ (Redis-backed)
- Email: Nodemailer (SMTP configurable)

### DevOps / Config
- Environment: dotenv with schema validation (Zod)
- Logging: Pino (structured JSON)
- API: RESTful, versioned at /api/v1/
- All secrets: environment variables only, never committed

---

## Golden Rules for Antigravity

1. **Never touch the existing codebase** — all new code goes in `/directorbyte-v2/`
2. **Preserve all existing features** — analyze Phase 00 inventory before building
3. **TypeScript everywhere** — no plain JS files in the new codebase
4. **No hardcoded values** — everything configurable via env or admin settings
5. **Every module is independently removable** — no spaghetti dependencies
6. **UI must match the design references** — no generic Material UI defaults
7. **Mobile responsive first** — all screens work on 375px width
8. **Complete each phase fully before starting the next**
