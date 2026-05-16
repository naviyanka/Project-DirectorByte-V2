# PHASE 01 — Architecture, Directory Scaffold & Base Configuration
> DirectorByte Rebuild · Depends on: PHASE_00 Analysis Report

---

## Objective

Scaffold the complete `/directorbyte-v2/` directory. No business logic yet —
only structure, base config files, environment setup, and package installation.
Every folder gets a README.md explaining its purpose. At the end of this phase
the monorepo should be installable and the dev server startable (showing a
placeholder page).

---

## 1.1 — Root Monorepo Structure

```
/directorbyte-v2/
├── package.json              ← root workspace config (if monorepo)
├── .env.example              ← full env variable reference
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── tsconfig.base.json        ← shared TS config
├── turbo.json                ← (if using Turborepo)
├── docker-compose.yml        ← PostgreSQL + Redis for local dev
├── Makefile                  ← dev shortcuts (make dev, make db:migrate, etc.)
├── ANALYSIS_REPORT.md        ← output from Phase 00
│
├── /apps/
│   ├── /web/                 ← React frontend (Vite + React 18)
│   └── /api/                 ← Node.js backend (Fastify or Express)
│
├── /packages/
│   ├── /types/               ← shared TypeScript types between apps
│   ├── /utils/               ← shared utility functions
│   ├── /ui/                  ← (optional) shared component library
│   └── /config/              ← shared config (zod env schemas, constants)
│
└── /docs/
    ├── README.md
    ├── MODULES.md
    ├── ADMIN_GUIDE.md
    ├── API_REFERENCE.md
    └── ARCHITECTURE.md
```

---

## 1.2 — Frontend App Structure (`/apps/web/`)

```
/apps/web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── /public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── /fonts/              ← self-hosted fonts
│
└── /src/
    ├── main.tsx              ← app entry point
    ├── App.tsx               ← router + providers
    ├── vite-env.d.ts
    │
    ├── /router/
    │   ├── index.tsx         ← React Router v6 route definitions
    │   ├── guards.tsx        ← AuthGuard, AdminGuard, GuestGuard
    │   └── routes.ts         ← route constants (typed path strings)
    │
    ├── /design-system/       ← (built in Phase 08)
    │   ├── tokens.css        ← CSS custom properties (colors, spacing, type)
    │   ├── index.ts          ← re-exports all components
    │   └── /components/
    │
    ├── /features/
    │   ├── /auth/
    │   ├── /home/
    │   ├── /studio/
    │   │   ├── /script/
    │   │   ├── /storyboard/
    │   │   ├── /keyframes/
    │   │   ├── /image-gen/
    │   │   ├── /video-gen/
    │   │   ├── /audio-gen/
    │   │   ├── /voiceover/
    │   │   ├── /assembly/
    │   │   └── /export/
    │   ├── /projects/
    │   ├── /settings/
    │   │   ├── /profile/
    │   │   ├── /api-keys/
    │   │   ├── /storage/
    │   │   └── /preferences/
    │   ├── /subscription/
    │   ├── /support/
    │   └── /admin/
    │       ├── /dashboard/
    │       ├── /users/
    │       ├── /subscriptions/
    │       ├── /promo-codes/
    │       ├── /api-services/
    │       ├── /content/
    │       ├── /tickets/
    │       ├── /announcements/
    │       ├── /system/
    │       └── /audit-log/
    │
    ├── /layouts/
    │   ├── AppLayout.tsx       ← main shell (sidebar + topbar + content)
    │   ├── AuthLayout.tsx      ← centered card layout for auth pages
    │   ├── AdminLayout.tsx     ← admin sidebar + topbar
    │   └── StudioLayout.tsx    ← full-screen studio workspace
    │
    ├── /store/
    │   ├── index.ts
    │   ├── auth.store.ts       ← user session, tokens
    │   ├── studio.store.ts     ← active project, pipeline state
    │   ├── ui.store.ts         ← sidebar open, theme, toasts
    │   └── admin.store.ts      ← admin session
    │
    ├── /services/
    │   ├── api.client.ts       ← Axios/fetch instance with interceptors
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── project.service.ts
    │   ├── studio.service.ts
    │   ├── subscription.service.ts
    │   ├── support.service.ts
    │   └── admin.service.ts
    │
    ├── /hooks/
    │   ├── useAuth.ts
    │   ├── useProject.ts
    │   ├── useStudio.ts
    │   ├── useSubscription.ts
    │   ├── useApiKeys.ts
    │   ├── useToast.ts
    │   ├── useTheme.ts
    │   ├── useMediaQuery.ts
    │   └── useDebounce.ts
    │
    ├── /lib/
    │   ├── queryClient.ts      ← React Query setup
    │   ├── axios.ts            ← configured Axios instance
    │   ├── google-auth.ts      ← Google OAuth helpers
    │   └── analytics.ts        ← (optional) event tracking abstraction
    │
    ├── /utils/
    │   ├── formatters.ts       ← date, number, filesize, duration formatters
    │   ├── validators.ts       ← shared Zod schemas for forms
    │   ├── cn.ts               ← clsx + tailwind-merge helper
    │   └── constants.ts        ← app-wide constants
    │
    └── /types/
        ├── api.types.ts        ← response shapes matching backend
        ├── studio.types.ts
        └── admin.types.ts
```

---

## 1.3 — Backend App Structure (`/apps/api/`)

```
/apps/api/
├── package.json
├── tsconfig.json
├── .env.example
│
└── /src/
    ├── server.ts             ← entry point, server bootstrap
    ├── app.ts                ← app factory (plugins, middleware, routes)
    │
    ├── /config/
    │   ├── env.ts            ← Zod-validated env schema + loader
    │   ├── database.ts       ← Prisma client singleton
    │   ├── redis.ts          ← Redis client singleton
    │   ├── email.ts          ← nodemailer transporter factory
    │   ├── storage.ts        ← GCS / Drive / local storage factory
    │   └── logger.ts         ← Pino logger config
    │
    ├── /middleware/
    │   ├── authenticate.ts   ← JWT validation, attach user to req
    │   ├── adminAuth.ts      ← admin session validation
    │   ├── authorize.ts      ← role/permission checker factory
    │   ├── rateLimiter.ts    ← per-route rate limiting
    │   ├── validateBody.ts   ← Zod request body validation middleware
    │   ├── requestId.ts      ← attach unique request ID for tracing
    │   ├── errorHandler.ts   ← centralized error → response formatter
    │   └── auditLogger.ts    ← log admin actions to AuditLog table
    │
    ├── /routes/
    │   ├── index.ts          ← register all routers
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── project.routes.ts
    │   ├── studio.routes.ts
    │   ├── apikeys.routes.ts
    │   ├── storage.routes.ts
    │   ├── subscription.routes.ts
    │   ├── support.routes.ts
    │   ├── admin.routes.ts
    │   └── webhook.routes.ts
    │
    ├── /controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── project.controller.ts
    │   ├── studio.controller.ts
    │   ├── apikeys.controller.ts
    │   ├── storage.controller.ts
    │   ├── subscription.controller.ts
    │   ├── support.controller.ts
    │   ├── admin.controller.ts
    │   └── webhook.controller.ts
    │
    ├── /services/
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── project.service.ts
    │   ├── studio.service.ts
    │   ├── apikey.service.ts
    │   ├── encryption.service.ts   ← AES-256 encrypt/decrypt for keys
    │   ├── storage.service.ts
    │   ├── subscription.service.ts
    │   ├── promo.service.ts
    │   ├── payment.service.ts      ← gateway-agnostic payment abstraction
    │   ├── support.service.ts
    │   ├── email.service.ts
    │   ├── admin.service.ts
    │   └── audit.service.ts
    │
    ├── /providers/
    │   ├── /ai/                    ← AI provider abstraction layer
    │   │   ├── provider.interface.ts
    │   │   ├── gemini.provider.ts
    │   │   ├── openai.provider.ts
    │   │   ├── anthropic.provider.ts
    │   │   └── provider.factory.ts ← returns provider by name
    │   ├── /payment/
    │   │   ├── gateway.interface.ts
    │   │   ├── stripe.gateway.ts
    │   │   ├── paddle.gateway.ts
    │   │   └── gateway.factory.ts
    │   └── /storage/
    │       ├── storage.interface.ts
    │       ├── gcs.storage.ts
    │       ├── drive.storage.ts
    │       ├── local.storage.ts
    │       └── storage.factory.ts
    │
    ├── /jobs/
    │   ├── queue.ts                ← BullMQ queue setup
    │   ├── workers/
    │   │   ├── email.worker.ts
    │   │   ├── subscription.worker.ts  ← renewal checks, expiry warnings
    │   │   ├── studio.worker.ts        ← async generation jobs
    │   │   └── cleanup.worker.ts       ← temp files, expired tokens
    │   └── schedulers/
    │       ├── daily.scheduler.ts
    │       └── hourly.scheduler.ts
    │
    ├── /prisma/                    ← (or at root if standalone)
    │   ├── schema.prisma
    │   ├── /migrations/
    │   └── /seeds/
    │       ├── seed.ts
    │       ├── plans.seed.ts
    │       └── admin.seed.ts
    │
    └── /utils/
        ├── crypto.ts               ← token generation, hashing
        ├── pagination.ts           ← cursor/offset pagination helpers
        ├── response.ts             ← standard API response builders
        └── errors.ts               ← typed error classes
```

---

## 1.4 — Environment Variables (`.env.example`)

Generate a complete `.env.example` with every variable the app needs.
Group them with comments:

```env
# ═══════════════════════════════════════
# APP
# ═══════════════════════════════════════
NODE_ENV=development
PORT=4000
APP_NAME=DirectorByte
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# ═══════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════
DATABASE_URL=postgresql://user:password@localhost:5432/directorbyte

# ═══════════════════════════════════════
# REDIS
# ═══════════════════════════════════════
REDIS_URL=redis://localhost:6379

# ═══════════════════════════════════════
# AUTH
# ═══════════════════════════════════════
JWT_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
ENCRYPTION_KEY=                    # 32-byte key for AES-256 (API key encryption)

# ═══════════════════════════════════════
# ADMIN (temporary fixed credentials)
# ═══════════════════════════════════════
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=               # bcrypt hash — run: npm run admin:hash <password>
ADMIN_SESSION_SECRET=

# ═══════════════════════════════════════
# GOOGLE OAUTH
# ═══════════════════════════════════════
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback

# ═══════════════════════════════════════
# GOOGLE CLOUD (PLATFORM-LEVEL / PAID PLANS)
# ═══════════════════════════════════════
GCS_BUCKET_NAME=
GCS_PROJECT_ID=
GCS_KEY_FILE_PATH=                 # path to service account JSON
VERTEX_AI_LOCATION=us-central1

# ═══════════════════════════════════════
# AI PROVIDERS (PLATFORM-LEVEL KEYS)
# ═══════════════════════════════════════
PLATFORM_GEMINI_API_KEY=
PLATFORM_OPENAI_API_KEY=
PLATFORM_ANTHROPIC_API_KEY=
PLATFORM_RUNWAYML_API_KEY=
PLATFORM_ELEVENLABS_API_KEY=
PLATFORM_STABILITY_API_KEY=

# ═══════════════════════════════════════
# PAYMENT GATEWAY
# ═══════════════════════════════════════
PAYMENT_GATEWAY=stripe             # stripe | paddle | razorpay
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# ═══════════════════════════════════════
# EMAIL (SMTP)
# ═══════════════════════════════════════
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@directorbyte.com
EMAIL_FROM_NAME=DirectorByte

# ═══════════════════════════════════════
# STORAGE
# ═══════════════════════════════════════
STORAGE_PROVIDER=local             # local | gcs | drive (per-user)
LOCAL_UPLOAD_PATH=./uploads
MAX_UPLOAD_SIZE_MB=100

# ═══════════════════════════════════════
# FEATURE FLAGS
# ═══════════════════════════════════════
FEATURE_GOOGLE_DRIVE=true
FEATURE_SUBSCRIPTIONS=true
FEATURE_SUPPORT_TICKETS=true
FEATURE_ADMIN_CENTER=true
```

---

## 1.5 — Base Config Files to Generate

- `tailwind.config.ts` — custom theme extending design system tokens
- `tsconfig.json` — strict mode, path aliases configured
- `vite.config.ts` — HMR, path aliases, env handling
- `eslintrc.json` — TypeScript-aware, import ordering rules
- `.prettierrc` — consistent formatting
- `docker-compose.yml` — PostgreSQL 15 + Redis 7 services
- `Makefile` — commands: `make dev`, `make build`, `make db:migrate`, `make db:seed`, `make admin:hash`

---

## 1.6 — Completion Criteria

This phase is complete when:
- [ ] Full directory tree exists with all folders and placeholder index files
- [ ] `npm install` succeeds in all workspaces
- [ ] `make dev` starts both frontend and backend without errors
- [ ] Frontend shows a placeholder "DirectorByte v2 — coming soon" page
- [ ] Backend responds to GET /api/v1/health with `{ status: "ok", version: "2.0.0" }`
- [ ] `.env.example` contains every variable needed
- [ ] Every folder has a README.md explaining its purpose
- [ ] TypeScript compiles with 0 errors in strict mode
