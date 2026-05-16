# PHASE 18 — Documentation: README, MODULES, ADMIN_GUIDE & API Reference
> DirectorByte Rebuild · Depends on: PHASE_17 (Polish Complete)

---

## Objective

Write complete, developer-grade documentation for every part of DirectorByte v2.
Documentation is not optional. It determines whether another developer can
contribute without asking questions, whether the admin can manage the platform
without engineering help, and whether the API can be consumed by integrations.

All docs live in `/docs/` and referenced from the root `README.md`.

---

## 18.1 — Root `README.md`

The root README is the first thing every developer sees. It must answer
these questions in order:

1. What is this?
2. What does it do?
3. How do I run it locally in under 5 minutes?
4. What is the project structure?
5. Where do I go to learn more?

### Structure

```markdown
# DirectorByte v2

AI-powered film generation platform. Turn any idea into a complete film
with AI-generated scripts, storyboards, keyframes, video, and audio —
all in one modular pipeline.

---

## Features
[Brief feature overview in bullet points — no more than 10]

## Tech Stack
[Table: Frontend / Backend / Database / Queue / Storage]

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Google Cloud account (for paid features)
- Stripe account (for subscriptions)

## Local Development

### 1. Clone and install
[Code block: git clone, npm install]

### 2. Environment setup
[Code block: cp .env.example .env, then fill in minimum required vars]

Minimum vars for local dev:
  DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY,
  ADMIN_USERNAME, ADMIN_PASSWORD_HASH,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### 3. Database setup
[Code block: make db:migrate && make db:seed]

### 4. Start dev servers
[Code block: make dev]
Opens:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Admin Center: http://localhost:3000/admin/login

### 5. Create admin password hash
[Code block: make admin:hash]
[Explanation of what ADMIN_PASSWORD_HASH is]

## Project Structure
[Full directory tree — same as Phase 01, summarized]

## Documentation
- [Architecture](./docs/ARCHITECTURE.md)
- [Module Guide](./docs/MODULES.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Environment Variables
[Table: Variable | Required | Default | Description — all vars from .env.example]

## Contributing
[Brief: branch naming, PR process, TypeScript strict mode required]

## License
[License info]
```

---

## 18.2 — Architecture Doc (`/docs/ARCHITECTURE.md`)

### Sections to cover

**System Overview Diagram**
```
                    ┌─────────────────────────────────────────┐
                    │           DIRECTORBYTE v2               │
                    └─────────────────────────────────────────┘

[Browser]
   │
   ├─── React App (Vite) ──────────────────────────┐
   │    http://localhost:3000                        │
   │    - Feature-based components                  │
   │    - Zustand state                             │
   │    - React Query server cache                  │
   │    - Framer Motion animations                  │
   │                                                │
   └─── REST API (Express/Fastify) ────────────────-┤
        http://localhost:4000/api/v1                │
        - JWT auth + session management             │
        - Zod request validation                    │
        - Prisma ORM                                │
        - BullMQ job queues                         │
                                                    │
        ├─── PostgreSQL (Prisma) ←──────────────────┘
        │    All persistent data
        │
        ├─── Redis
        │    Sessions, rate limiting, job queues
        │
        ├─── Google Cloud Storage (or local)
        │    Generated files, avatars, exports
        │
        ├─── AI Providers (via provider abstraction)
        │    Gemini, OpenAI, Anthropic, RunwayML, etc.
        │
        └─── Stripe
             Subscription billing and webhooks
```

**Authentication Architecture**
- JWT access token (15min) in memory
- Refresh token (30 days) in HttpOnly cookie
- Admin session: separate table-backed session (4hr)
- Google OAuth: full callback flow described

**Data Flow: AI Generation**
```
User click → POST /api/v1/studio/generate
          → Quota check → GenerationJob created → BullMQ queue
          → Worker: resolve API key → call provider → update job
          → Frontend polls GET /api/v1/studio/jobs/:id
          → Job COMPLETED → output rendered in stage workspace
```

**Data Flow: Subscription Upgrade**
```
Checkout form → POST /api/v1/subscriptions/checkout
             → Promo validation → Price calculation
             → Stripe checkout session created → redirect
             → User pays on Stripe → Stripe webhook fires
             → POST /webhooks/stripe (verified by signature)
             → Subscription activated → Email sent → Usage reset
```

**Multi-provider Architecture**
- AI providers: `AIProvider` interface, factory pattern
- Payment gateways: `PaymentGateway` interface, factory pattern
- Storage adapters: `StorageAdapter` interface, factory pattern
- Adding a new provider = implement interface + register in factory

**Queue Architecture**
- email-queue: all outbound emails, retry on SMTP failure
- generation-queue: AI jobs, priority queue (paid > free)
- cleanup-queue: file deletion, session cleanup
- subscription-queue: renewal checks, grace period enforcement
- Each queue: named BullMQ queue with dedicated worker process

---

## 18.3 — Module Guide (`/docs/MODULES.md`)

Document every feature module with a consistent structure.
This is the developer's guide to modifying individual features
without breaking unrelated parts.

### Template for each module:
```markdown
## Module: [Module Name]

**Purpose:** [1-2 sentence description]
**Entry points:** [route paths and component file paths]
**Backend routes:** [list of API endpoints]
**Database models:** [Prisma models used]
**External services:** [any third-party APIs called]
**State:** [Zustand store used, React Query keys]
**Depends on:** [other modules or services it requires]
**What to modify if:** [specific change scenarios]
```

### Modules to document:

#### 1. Authentication Module
```
Purpose: Handles all user identity and session management.
Entry points: /signin, /signup, /forgot-password, /reset-password,
              /verify-email, /onboarding, /oauth/callback
Backend routes: /api/v1/auth/*
Database models: User, Session, StorageConnection
External services: Google OAuth API
State: auth.store (Zustand)
Depends on: Email service, Google OAuth credentials

To add a new OAuth provider (e.g., GitHub):
  1. Add OAuth credentials to .env.example
  2. Create /api/v1/auth/github and /api/v1/auth/github/callback routes
  3. Add to auth.service.ts
  4. Add button to SignIn and SignUp pages
  5. No other modules need to change

To change session expiry:
  1. Update JWT_ACCESS_EXPIRY and JWT_REFRESH_EXPIRY in .env
  2. Update cookie maxAge in auth.routes.ts
  3. No frontend changes needed
```

#### 2. Project Module
```
Purpose: Manages user film projects — creation, organization, versioning.
Entry points: /home (project grid), /projects (full list)
Backend routes: /api/v1/projects/*
Database models: Project, ProjectVersion
State: React Query (projects, project/:id)
Depends on: Auth, Storage, Studio (for generation jobs)

To add a new project field:
  1. Add field to Prisma Project model
  2. Add migration: npx prisma migrate dev --name add_[field]
  3. Add to PATCH /api/v1/projects/:id controller
  4. Add to project form (NewProjectModal or project settings)
  5. Add to project card display if visible

To change project version limit (default 50):
  1. Update constant in /apps/api/src/controllers/project.controller.ts
  2. Update "50 versions" mention in docs
```

#### 3. Studio Module
```
Purpose: The film generation pipeline workspace.
Entry points: /studio/:projectId
Sub-modules: script, storyboard, keyframes, image-gen, video-gen,
             audio-gen, voiceover, assembly, export
Backend routes: /api/v1/studio/*
Database models: GenerationJob, Project
External services: All AI providers (via AIProvider interface)
State: studio.store (Zustand), React Query (jobs)
Depends on: AI Provider Layer, Usage Tracking, Project module

To add a new studio stage:
  1. Create /features/studio/[stage-name]/ directory
  2. Add stage config to PIPELINE_STAGES constant
  3. Add stage route to /studio/:projectId/[stage] router
  4. Create StageComponent implementing StageBase interface
  5. Add AIModule enum value if new module type
  6. Implement provider for the new module type
  7. Add module to plan features array for appropriate plans

To add a new AI provider to an existing module:
  1. Add provider class in /providers/ai/[provider].provider.ts
  2. Implement AIProvider interface methods for the module
  3. Register in provider.factory.ts
  4. Add to provider registry config (returned by GET /api/v1/api-keys/providers)
  5. No frontend changes needed — it will appear in provider selection automatically
```

#### 4. API Key Manager Module
```
Purpose: Lets users add and manage their own AI provider API keys.
Entry points: /settings/api-keys
Backend routes: /api/v1/api-keys/*
Database models: ApiKey
External services: Every AI provider (for key validation)
State: React Query (api-keys)
Depends on: Encryption service

Security rules:
- encryptedKey NEVER leaves the backend
- keyHint (last 4 chars) is the only key identifier shown to users
- Encryption uses AES-256-GCM with per-value random IV
- Decryption only happens in studio.worker.ts at job time

To add a new provider to the registry:
  1. Add entry to /config/providers.config.ts
  2. Implement validate() in provider class
  3. Provider appears automatically in Settings > API Keys UI
```

#### 5. Subscription Module
```
Purpose: Plan selection, checkout, usage tracking, billing history.
Entry points: /pricing, /subscription, /subscription/checkout
Backend routes: /api/v1/subscriptions/*, /api/v1/plans, /api/v1/webhooks/stripe
Database models: Subscription, SubscriptionUsage, Plan, PaymentRecord, PromoCode
External services: Stripe
State: React Query (subscription/me)
Depends on: Payment gateway layer, Email service

To add a new plan:
  1. Create plan in Stripe dashboard, get monthly + annual price IDs
  2. POST /api/v1/admin/plans with plan data
  3. Plan appears on pricing page automatically (if isPublic=true)

To add a new billing gateway (e.g., Paddle):
  1. Implement PaymentGateway interface in /providers/payment/paddle.gateway.ts
  2. Register in gateway.factory.ts
  3. Add PADDLE_* vars to .env.example
  4. Admin can switch gateway in Settings > Payment (PAYMENT_GATEWAY env var)
  5. No frontend changes needed
```

#### 6. Admin Module
```
Purpose: Platform management — users, subscriptions, content, system settings.
Entry points: /admin/* (all routes require admin session)
Backend routes: /api/v1/admin/*
Database models: AdminSession, AuditLog + all other models (read/write)
State: admin.store (Zustand)
Depends on: All other modules (admin can touch everything)

To add a new admin panel section:
  1. Add nav item to admin sidebar config
  2. Create /pages/admin/[section]/ directory
  3. Create backend routes in /routes/admin.[section].routes.ts
  4. Add routes to admin.routes.ts
  5. Add AuditLog entries for destructive actions
  6. All admin routes must use adminAuth middleware

Audit log: every action that modifies data must be logged:
  - Use auditLogger middleware on mutating admin routes
  - Always log: action (AuditAction enum), adminId, target, details (diff)
```

#### 7. Support Module
```
Purpose: Help center, ticket submission, ticket management.
Entry points: /support (user), /admin/tickets (admin)
Backend routes: /api/v1/support/*, /api/v1/help/*, /api/v1/admin/support/*
Database models: SupportTicket, TicketMessage, TicketInternalNote, HelpArticle
State: React Query (tickets, help-articles)
Depends on: Email service, Notification system

To add a new ticket category:
  1. Add to category enum in schema.prisma
  2. Run migration
  3. Add to ticket form options in /features/support/SubmitTicket
  4. Add to admin ticket filter options

To write/edit help articles:
  1. Log into Admin Center → Content → Help Articles
  2. Create/edit article, set status to Published
  3. Articles appear at /support/help automatically
```

#### 8. Notification Module
```
Purpose: In-app notifications for key events.
Entry points: Topbar bell icon → NotificationPanel
Backend routes: /api/v1/notifications/*
Database models: Notification
State: React Query (notifications), polled every 30s

To send a new notification type:
  1. Add type to notification type enum in schema.prisma
  2. Create helper in notification.service.ts:
     notificationService.create(userId, 'new_type', { ...data })
  3. Call it from the relevant service/worker
  4. Add display template in NotificationPanel (icon + message format)
```

#### 9. Storage Module
```
Purpose: File storage abstraction — local, Google Cloud Storage, Google Drive.
Entry points: /settings/storage (Drive connect)
Backend routes: /api/v1/storage/*
Database models: StorageConnection
External services: Google Drive API, Google Cloud Storage

Storage adapter interface (/providers/storage/storage.interface.ts):
  upload(file, path): Promise<{ url, fileId, sizeBytes }>
  download(fileId): Promise<Buffer>
  delete(fileId): Promise<void>
  getSignedUrl(fileId, expiresIn): Promise<string>
  getQuota(): Promise<{ used, total }>

To add a new storage provider (e.g., S3):
  1. Create /providers/storage/s3.storage.ts
  2. Implement StorageAdapter interface
  3. Register in storage.factory.ts
  4. Add S3_* vars to .env.example
  5. Add "Amazon S3" option to storage settings UI
  6. No other changes needed — all file operations use the interface
```

---

## 18.4 — Admin Guide (`/docs/ADMIN_GUIDE.md`)

Written for the platform administrator, not developers. Use plain language.
Assume the reader can use a web interface but doesn't write code.

### Sections

#### Getting Started
```markdown
## Accessing the Admin Center

1. Navigate to: https://app.directorbyte.com/admin/login
2. Enter your admin username and password
3. All actions you take are logged in the Audit Log

⚠️ The admin center is restricted. Do not share your credentials.
```

#### Dashboard Overview
```
KPI cards:
- Total users / Active (30d) / New this month
- Active subscriptions / MRR / ARR
- Open support tickets / Urgent
- Credits used this month / Storage used

Charts: user growth, revenue, generation volume
Activity feed: recent significant events
```

#### User Management
```
Finding a user:
- Use search bar (email or name)
- Filter by status: Active / Suspended / Banned
- Filter by plan

Viewing a user:
- Click any user row to open full profile
- See: subscription, usage, sessions, API keys, tickets, audit history

Actions available on a user:
- Edit: display name, bio, email verification status
- Suspend: temporarily blocks access (reversible)
- Ban: permanent block (can be reversed in edge cases)
- Enable: re-activate suspended/banned account
- Reset password: sends email OR set directly
- Sign in as user: view app as that user (logged in audit)
- Send direct email: custom message from platform email
- Terminate sessions: force sign out all devices
- Assign subscription: give any plan manually (no payment)
- Adjust credits: add or remove credits (with reason)
```

#### Subscription Management
```
Viewing subscriptions:
- All subscriptions with user, plan, status, MRR
- Filter: status, plan, billing cycle, gateway, has promo

Manually assigning a plan to a user:
1. Go to Users → select user
2. Click "Assign Subscription"
3. Select plan, billing cycle, optional expiry
4. Optional: add a reason note
5. Submit — user gets the plan immediately, no payment required

Adjusting credits:
- Positive amount: adds credits (e.g., compensation for outage)
- Negative amount: removes credits
- Reason is required and logged
```

#### Promo Code Management
```
Creating a promo code:
1. Go to Promo Codes → New Code
2. Set code string (auto-uppercased)
3. Choose discount type:
   - Percent: e.g., 30% off
   - Fixed amount: e.g., $10 off
   - Trial days: e.g., 14 extra trial days
   - Free upgrade: e.g., Creator plan free for 30 days
4. Set limits: max total uses, max per user, expiry date
5. Restrict to specific plans (optional)
6. Check "First-time only" to limit to new subscribers
7. Save and share the code

Checking code performance:
- Click any code to see redemptions: user, date, discount applied
```

#### API & Services Configuration
```
Platform AI keys (used by paid plan subscribers):
1. Go to API & Services → AI Providers
2. Find the provider (e.g., Gemini, OpenAI)
3. Click "Edit" → paste new API key → Save
4. Click "Test" to verify the key works
5. Set monthly budget cap to prevent overspend

Updating payment gateway settings:
1. Go to API & Services → Payment
2. Update Stripe keys (use test keys in development)
3. Webhook URL shown — must be registered in Stripe dashboard
4. Test with Stripe CLI before going live

Updating SMTP email settings:
1. Go to API & Services → Email
2. Enter SMTP host, port, credentials
3. "Send test email" button verifies it works

Storage configuration:
1. Go to API & Services → Storage
2. Switch between local, Google Cloud Storage, or per-user Drive
3. GCS: requires service account JSON key file path
```

#### System Settings
```
Maintenance mode:
1. Go to System → Maintenance
2. Toggle on with optional message (shown to users)
3. All API calls (except health check) return 503
4. Toggle off when maintenance complete

Feature flags:
1. Go to System → Feature Flags
2. Toggle any feature on/off immediately (no deploy needed)
3. Changes apply app-wide within seconds
Available flags:
- registration_open: allow new signups
- google_drive: enable Drive integration
- subscriptions: enable paid plans
- support_tickets: enable support system

Registration control:
- Set registration_open = false to stop new signups
- Existing users unaffected
```

#### Support Ticket Management
```
Inbox overview:
- Sorted by priority (Urgent first) then date
- Color coding: Urgent = red, High = orange, Normal = gray
- Unread indicator: bold subject

Working a ticket:
1. Click ticket to open thread
2. Read full conversation including internal notes
3. Write reply (visible to user) — sends email notification automatically
4. Add internal note (only visible to admin — for context, not sent to user)
5. Change priority if needed (escalate urgent issues)
6. Assign to another admin if applicable
7. Close when resolved

Canned responses:
- Save frequently-used replies as templates
- Insert with one click in reply box
- Edit/delete in Settings → Canned Responses
```

#### Announcements
```
Creating an announcement:
1. Go to Announcements → New
2. Choose type: Info / Warning / Success / Maintenance
3. Choose target:
   - All users
   - Free users only
   - Paid users only
   - Specific plan
4. Set start and end dates
5. Toggle Dismissible (allow users to hide it)
6. Activate to make it live immediately
```

#### Audit Log
```
The audit log records every admin action.
Fields: Admin user, Action type, Target (user/resource), Details, IP, Time

Filtering:
- By action type (e.g., USER_SUSPENDED, SUBSCRIPTION_ASSIGNED)
- By admin (useful for reviewing another admin's actions)
- By target user
- By date range

Exporting:
- Filter as needed → Export CSV
- Maximum 10,000 rows per export
- Use for compliance reviews or incident investigation
```

---

## 18.5 — API Reference (`/docs/API_REFERENCE.md`)

Auto-generate where possible, but write human-friendly descriptions.

### Structure

```markdown
# DirectorByte API Reference

Base URL: https://api.directorbyte.com/api/v1
All requests: Content-Type: application/json
Authentication: Authorization: Bearer {accessToken}

## Response format
All responses follow this structure:
[Success and error format from Phase 03]

## Rate limiting
[Rate limits per endpoint group from Phase 03]

## Endpoints
[Organized by resource group]
```

### Document every endpoint with:
```markdown
### POST /auth/register

Create a new user account.

**Authentication:** None required

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | ✓ | User email address |
| password | string | ✓ | Min 8 chars, 1 uppercase, 1 number |
| displayName | string | ✓ | Display name (max 50 chars) |

**Responses:**
- `201`: Account created, verification email sent
  ```json
  { "success": true, "data": { "message": "Check your email to verify your account" } }
  ```
- `409`: Email already registered
  ```json
  { "success": false, "error": { "code": "EMAIL_TAKEN", "message": "..." } }
  ```
- `422`: Validation error
  ```json
  { "success": false, "error": { "code": "VALIDATION_ERROR", "fields": { "password": "Too weak" } } }
  ```
- `429`: Rate limit exceeded
```

Produce this format for every endpoint from phases 03–07 and 16.

---

## 18.6 — Deployment Guide (`/docs/DEPLOYMENT.md`)

### Production environment checklist

**Environment variables for production:**
```bash
NODE_ENV=production
APP_URL=https://app.directorbyte.com
API_URL=https://api.directorbyte.com
DATABASE_URL=postgresql://...@db.host:5432/directorbyte?sslmode=require
REDIS_URL=redis://...@redis.host:6379
JWT_SECRET=[64+ char random string]
ENCRYPTION_KEY=[exactly 32 char string]
ADMIN_PASSWORD_HASH=[bcrypt hash]
# ... all other vars
```

**Production hardening checklist:**
- [ ] All secrets rotated from development values
- [ ] PostgreSQL using SSL connection (`sslmode=require`)
- [ ] Redis using TLS
- [ ] HTTPS enforced (no HTTP in production)
- [ ] CORS restricted to production domain only
- [ ] Rate limiting active and tuned for production traffic
- [ ] Stripe using live mode keys (not test)
- [ ] SMTP using transactional email provider (SendGrid, Postmark, etc.)
- [ ] Error reporting configured (Sentry or similar)
- [ ] Database backups scheduled
- [ ] Log aggregation configured

**Running migrations in production:**
```bash
# Always back up DB before migrating
npx prisma migrate deploy   # (not migrate dev — deploy is safe for production)
```

**Scaling considerations:**
- Backend: horizontal scaling safe (stateless, Redis for sessions)
- BullMQ workers: can run as separate processes or containers
- Studio workers: most resource-intensive, scale separately if needed
- Database: connection pooling with PgBouncer recommended at scale

---

## 18.7 — Completion Criteria

- [ ] Root README.md: local dev setup works following only the README
- [ ] README: all env variables documented in table
- [ ] ARCHITECTURE.md: system diagram, auth flow, data flows documented
- [ ] MODULES.md: all 9 modules documented with full template
- [ ] Each module: "What to modify if" section covers common change scenarios
- [ ] ADMIN_GUIDE.md: all admin panels documented in plain language
- [ ] ADMIN_GUIDE.md: every admin action has step-by-step instructions
- [ ] API_REFERENCE.md: every endpoint documented with request/response
- [ ] DEPLOYMENT.md: production checklist complete
- [ ] All docs spell-checked and reviewed for clarity
- [ ] All code blocks in docs tested and verified to work
- [ ] README "Local development" section tested fresh on a clean machine
- [ ] `/docs/` folder linked correctly from root README
- [ ] Phase 00 ANALYSIS_REPORT.md preserved and referenced

---

## 18.8 — Final Project Completion Checklist

After all 18 phases are complete, verify the entire platform end-to-end:

### Feature parity with Phase 00 analysis
- [ ] All features from ANALYSIS_REPORT.md marked "Migrate: yes" are implemented
- [ ] All features marked "Migrate: modified" are implemented in new form
- [ ] All known bugs from Phase 00 "Known Issues" section are fixed

### Quality gates
- [ ] Zero TypeScript errors across all workspaces (`tsc --noEmit`)
- [ ] Zero ESLint errors
- [ ] All API endpoints tested (Postman collection or equivalent)
- [ ] All frontend pages reviewed at 375px and 1280px
- [ ] Lighthouse scores: Performance ≥ 85, Accessibility ≥ 95 on all key pages
- [ ] axe DevTools: zero critical/serious violations

### Security checklist
- [ ] No API keys or secrets in committed code (grep for common patterns)
- [ ] All admin routes return 401 without admin session
- [ ] All user routes return 401 without valid JWT
- [ ] Users cannot access other users' resources (verify ownership on all routes)
- [ ] Stripe webhooks verify signature before processing
- [ ] SQL injection: Prisma parameterizes all queries (no raw string interpolation)
- [ ] XSS: all user content rendered as text, not innerHTML
- [ ] Rate limiting active on all auth and generation endpoints
- [ ] AES-256 encryption verified on all stored API keys

### Documentation completeness
- [ ] README enables local setup in under 10 minutes
- [ ] Every module documented
- [ ] Admin guide covers every admin panel
- [ ] API reference covers every endpoint
- [ ] Deployment guide covers production checklist
```
