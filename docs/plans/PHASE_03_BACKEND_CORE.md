# PHASE 03 — Backend Core: Config, Auth, Middleware & Email
> DirectorByte Rebuild · Depends on: PHASE_02 Database

---

## Objective

Build the backbone of the backend: environment validation, authentication system,
all middleware, email service, and the health/utility endpoints.
No feature business logic yet — this phase is pure infrastructure.

---

## 3.1 — Environment Configuration (`/config/env.ts`)

Use Zod to validate all environment variables at startup.
App must fail to start with a clear error message if any required var is missing.

```typescript
// Pattern to implement:
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  // ... all variables from Phase 01 .env.example
})

export const env = envSchema.parse(process.env)
// Then use: import { env } from '@/config/env' everywhere — never process.env directly
```

---

## 3.2 — Authentication System

### 3.2.1 — Email/Password Auth

**POST /api/v1/auth/register**
- Body: `{ email, password, displayName }`
- Validate email format, password strength (min 8 chars, 1 upper, 1 number)
- Check email not already registered
- Hash password with bcrypt (cost 12)
- Create User + Profile + SubscriptionUsage records in transaction
- Auto-assign Free Plan subscription
- Send verification email with 24-hour token
- Return: `{ message: "Check your email to verify your account" }`
- Do NOT return tokens yet — require email verification first

**POST /api/v1/auth/login**
- Body: `{ email, password }`
- Check email exists and is verified
- Check account not suspended/banned
- Check login attempts — if >= maxAttempts, check lockoutUntil
- Verify password with bcrypt
- On success: reset loginAttempts, update lastLoginAt
- Create Session record with device info
- Return: `{ accessToken, refreshToken, user: { id, email, displayName, role, subscription } }`
- On failure: increment loginAttempts, lock if threshold reached

**POST /api/v1/auth/refresh**
- Body: `{ refreshToken }`
- Validate refresh token exists in Session table and not expired
- Issue new accessToken (and optionally rotate refreshToken)
- Return: `{ accessToken }`

**POST /api/v1/auth/logout**
- Auth required
- Delete Session record from DB (invalidates refresh token)
- Return: `{ success: true }`

**POST /api/v1/auth/logout-all**
- Auth required
- Delete ALL sessions for this user
- Return: `{ success: true, sessionsTerminated: N }`

**POST /api/v1/auth/forgot-password**
- Body: `{ email }`
- Always return same response (don't leak if email exists)
- If email found and verified: create password reset token (1 hour expiry), send email
- Rate limit: 3 requests per hour per IP

**POST /api/v1/auth/reset-password**
- Body: `{ token, newPassword }`
- Validate token not expired
- Validate password strength
- Update password hash, clear reset token
- Invalidate all existing sessions for security
- Send password-changed confirmation email

**GET /api/v1/auth/verify-email?token=**
- Validate token not expired
- Set user.emailVerified = true, clear token
- Redirect to frontend with success param

**POST /api/v1/auth/resend-verification**
- Body: `{ email }`
- Rate limit: 1 per 5 minutes per email
- Resend with fresh token

### 3.2.2 — Google OAuth

**GET /api/v1/auth/google**
- Redirect to Google OAuth consent screen
- Scopes: profile, email, (optionally drive.file when user opts in)
- State param: encode redirect intent

**GET /api/v1/auth/google/callback**
- Exchange code for tokens
- Upsert user (create if new, update tokens if existing)
- If new user: create Profile, assign Free plan, mark email verified
- If existing user: update googleAccessToken, googleRefreshToken
- Create Session record
- Redirect to frontend with tokens in query params (or set HTTP-only cookie)

**POST /api/v1/auth/google/drive-connect**
- Auth required
- Additional OAuth flow requesting drive.file scope
- Store Drive tokens in StorageConnection table
- Return: `{ connected: true, quotaBytes, usedBytes }`

**DELETE /api/v1/auth/google/drive-disconnect**
- Auth required
- Revoke Drive tokens
- Delete StorageConnection record
- Switch user storage back to local
- Return: `{ success: true }`

### 3.2.3 — JWT Utilities

```typescript
// tokens.ts
generateAccessToken(userId, role): string  // 15min expiry
generateRefreshToken(): string             // 30 days, stored in DB
verifyAccessToken(token): JwtPayload | null
generateEmailToken(): string               // 64 char hex, 24hr expiry
generatePasswordResetToken(): string       // 64 char hex, 1hr expiry
```

---

## 3.3 — Middleware

### authenticate.ts
```typescript
// Extracts Bearer token from Authorization header
// Verifies JWT, fetches user from DB, checks user.status === ACTIVE
// Attaches to req.user: { id, email, role, subscriptionStatus, planFeatures }
// Returns 401 if missing/invalid, 403 if suspended
```

### adminAuth.ts
```typescript
// Checks for admin session token (separate from user JWT)
// Session stored in AdminSession table with expiry
// Returns 401 if no valid admin session
// Attaches req.admin: { username, sessionId }
```

### authorize.ts
```typescript
// Factory: authorize('ADMIN') or authorize('USER')
// Role-based access, used after authenticate middleware
// Returns 403 if role doesn't match
```

### rateLimiter.ts
```typescript
// Redis-backed rate limiter
// Presets:
//   authLimiter: 10 requests / 15 min / IP  (login, register, forgot-password)
//   apiLimiter: 100 requests / 1 min / user  (general API)
//   generationLimiter: 10 requests / 1 min / user  (AI generation)
//   uploadLimiter: 20 requests / 1 hour / user  (file uploads)
// Returns 429 with Retry-After header when exceeded
```

### validateBody.ts
```typescript
// Factory: validateBody(zodSchema)
// Validates req.body against schema
// Returns 422 with array of field errors if invalid
// Strips unknown fields (strict mode)
```

### requestId.ts
```typescript
// Generates UUID for each request
// Attaches as req.id and X-Request-ID response header
// Used in all logs for tracing
```

### errorHandler.ts
```typescript
// Central error handler - catches all unhandled errors
// Maps error types to HTTP codes:
//   ValidationError → 422
//   AuthError → 401
//   ForbiddenError → 403
//   NotFoundError → 404
//   ConflictError → 409
//   PaymentError → 402
//   Error → 500 (never leak stack trace in production)
// Logs full error with requestId in development
// Returns: { error: { code, message, fields? } }
```

### auditLogger.ts
```typescript
// Middleware for admin routes
// Logs every admin action to AuditLog table
// Captures: action, adminId, targetUserId, targetResource, details, IP
// Non-blocking (fire and forget to not slow admin operations)
```

---

## 3.4 — Standard API Response Format

All endpoints return consistent JSON:

```typescript
// Success
{ success: true, data: T, meta?: { page, perPage, total, totalPages } }

// Error
{ success: false, error: { code: string, message: string, fields?: Record<string, string> } }
```

Implement `response.ts` utility with typed builder functions:
```typescript
ok(data, meta?)          → 200
created(data)            → 201
noContent()              → 204
paginated(data, meta)    → 200 with pagination meta
badRequest(code, msg, fields?) → 400
unauthorized(msg?)       → 401
forbidden(msg?)          → 403
notFound(resource?)      → 404
conflict(msg)            → 409
unprocessable(fields)    → 422
tooManyRequests(retryAfter) → 429
serverError(msg?)        → 500
```

---

## 3.5 — Email Service

### Email provider setup
- Nodemailer with SMTP transport (config from env)
- Queue all emails via BullMQ (never block request handlers with email sending)
- Retry failed emails up to 3 times with exponential backoff
- Log all sends (success/failure) to console, not DB

### Email templates (use Handlebars or MJML)

All templates share:
- DirectorByte logo + branding header
- Clear, readable body (max 600px width)
- Footer: unsubscribe link, company address, support link

Templates to build:

**welcome.hbs**
```
Subject: Welcome to DirectorByte, {{displayName}}!
Body:
- Welcome headline
- What they can do (3 bullet features)
- CTA: "Start Your First Project" button
- Link to help docs
- Current plan: Free (upgrade prompt)
```

**verify-email.hbs**
```
Subject: Verify your DirectorByte email
Body:
- "Click to verify" CTA button (token link, 24hr)
- Alternative: copy/paste link
- "Didn't sign up?" note
```

**password-reset.hbs**
```
Subject: Reset your DirectorByte password
Body:
- Reset button (1-hour link)
- Security note: ignore if not requested
- Link to contact support
```

**password-changed.hbs**
```
Subject: Your DirectorByte password was changed
Body:
- Confirmation that password was changed
- If not you: reset immediately CTA
- Account security tips
```

**subscription-confirmation.hbs**
```
Subject: You're on {{planName}} — DirectorByte
Body:
- Plan name + features list
- Next billing date
- Credits/storage allotment
- CTA: "Go to Studio"
- Invoice link (if paid)
```

**subscription-renewal-reminder.hbs**
```
Subject: Your DirectorByte plan renews in {{daysUntil}} days
Body:
- Plan name + renewal amount
- Renewal date
- "Update payment info" link
- Cancel link
```

**subscription-renewal-failed.hbs**
```
Subject: Payment failed — Action required
Body:
- What failed, amount
- "Update payment method" CTA
- Grace period end date
- What happens if not resolved
```

**subscription-canceled.hbs**
```
Subject: Subscription canceled — Access until {{endDate}}
Body:
- Confirmation of cancellation
- Access end date
- "Reactivate" CTA
- Export data reminder
```

**account-suspended.hbs**
```
Subject: Your DirectorByte account has been suspended
Body:
- Reason (if provided by admin)
- Contact support CTA
- Appeal instructions
```

**support-ticket-received.hbs**
```
Subject: Support ticket #{{ticketId}} received
Body:
- Ticket summary
- Expected response time
- Link to view ticket
```

**support-ticket-reply.hbs**
```
Subject: New reply on ticket #{{ticketId}}
Body:
- Admin reply preview
- CTA: "View full reply"
- Reply instructions
```

**invoice.hbs**
```
Subject: Invoice from DirectorByte — {{amount}} {{currency}}
Body:
- Invoice number, date, plan, amount
- Payment method (masked card or gateway)
- Download PDF button
- "Need help?" support link
```

---

## 3.6 — Utility Routes

**GET /api/v1/health**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "timestamp": "2025-...",
  "services": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

**GET /api/v1/version**
```json
{ "version": "2.0.0", "environment": "production" }
```

---

## 3.7 — Logging Setup (Pino)

Configure structured JSON logging:
```typescript
{
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  // Every log includes: requestId, userId (if authenticated), path, method
}
```

Log these events minimum:
- Every request: method, path, statusCode, duration, requestId
- Auth events: login success/fail, register, password reset
- Generation jobs: queued, started, completed, failed (with duration)
- Payment events: all
- Admin actions: all
- Errors: full stack in development, message only in production

---

## 3.8 — Completion Criteria

- [ ] All auth endpoints work and tested via Postman/REST client
- [ ] Rate limiters active and returning 429 when triggered
- [ ] JWT access + refresh token flow working end-to-end
- [ ] Google OAuth flow completes and creates/updates user
- [ ] Email templates render correctly and send via configured SMTP
- [ ] All middleware tested: auth, admin, rate limit, validation, error handler
- [ ] Pino logs showing structured JSON with requestId
- [ ] /api/v1/health returns correct DB + Redis status
- [ ] Zero TypeScript errors
