# ADDENDUM 01 — Gap Fixes & Missing Pieces
> DirectorByte Rebuild · Apply AFTER Phase 07, BEFORE Phase 08
> This file patches all inconsistencies identified in REVIEW_AND_GAPS.md

---

## When to Apply This Addendum

Run this file as a dedicated Antigravity session between Phase 07 and Phase 07B.
Do not merge it into other phases — treat it as a focused fix pass.

Tell Antigravity:
```
We are applying ADDENDUM_01 to the DirectorByte v2 codebase.
This is a gap-fix session — no new features, only adding missing pieces.
Existing code should only be MODIFIED (not deleted/replaced) unless explicitly stated.
Work in /directorbyte-v2/ only.
Apply all sections below in order.
```

---

## FIX 01 — Missing Database Models (add to schema.prisma)

Open `/directorbyte-v2/packages/db/schema.prisma` and ADD these models.
Do not remove or change any existing models.

### Notification Model

```prisma
/// In-app notifications delivered to users for key events
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  /// Notification type - determines icon and color in UI
  type      String   // e.g. "subscription_upgraded", "support_ticket_reply", etc.

  title     String
  body      String
  /// Optional deep-link within the app
  link      String?

  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

### CannedResponse Model

```prisma
/// Pre-written reply templates used by admin support staff
model CannedResponse {
  id          String   @id @default(cuid())
  /// Display title shown in the dropdown when picking a canned response
  title       String
  /// Full reply body (may include {{ticketId}}, {{userName}} placeholders)
  body        String   @db.Text
  /// Category for grouping: "billing", "technical", "account", "general"
  category    String   @default("general")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdByAdminId String

  @@index([category, isActive])
}
```

### EmailTemplate Model

```prisma
/// Editable email templates stored in DB. Falls back to file-based .hbs if DB entry is null.
model EmailTemplate {
  /// Key matches the template name: "welcome", "verify-email", "password-reset", etc.
  key         String   @id
  subject     String
  /// Full HTML body. Supports Handlebars syntax: {{displayName}}, {{planName}}, etc.
  htmlBody    String   @db.Text
  /// Available variables listed for admin reference (JSON array of strings)
  variables   Json     @default("[]")
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
  updatedByAdminId String?
}
```

After adding these models:
```bash
cd packages/db
npx prisma migrate dev --name add_notification_canned_response_email_template
npx prisma generate
```

Also add the `Notification` relation to the `User` model:
```prisma
// In the User model, add:
notifications  Notification[]
```

---

## FIX 02 — Missing Env Vars (add to .env.example)

Open `/directorbyte-v2/.env.example` and add these lines under the AI Providers section:

```env
# ─── AI Providers — Video Generation ───────────────────────────────────────
PLATFORM_RUNWAYML_API_KEY=
PLATFORM_KLING_ACCESS_KEY=
PLATFORM_KLING_SECRET_KEY=
PLATFORM_PIKA_API_KEY=

# ─── AI Providers — Audio / Music Generation ────────────────────────────────
PLATFORM_SUNO_API_KEY=
PLATFORM_MUBERT_API_KEY=

# ─── AI Providers — Voice / TTS ─────────────────────────────────────────────
PLATFORM_ELEVENLABS_API_KEY=
PLATFORM_PLAYHT_API_KEY=
PLATFORM_PLAYHT_USER_ID=

# ─── AI Providers — Image Generation (additional) ───────────────────────────
PLATFORM_STABILITY_API_KEY=
PLATFORM_FAL_API_KEY=

# ─── AI Providers — STT / Transcription ─────────────────────────────────────
# Uses PLATFORM_OPENAI_API_KEY for Whisper by default — no extra key needed.
# Override to use a dedicated transcription key:
PLATFORM_WHISPER_API_KEY=
```

Also add these to the Zod env schema in `/directorbyte-v2/packages/config/env.ts`:
```typescript
// All optional — platform keys are used when users don't supply their own
PLATFORM_RUNWAYML_API_KEY:    z.string().optional(),
PLATFORM_KLING_ACCESS_KEY:    z.string().optional(),
PLATFORM_KLING_SECRET_KEY:    z.string().optional(),
PLATFORM_PIKA_API_KEY:        z.string().optional(),
PLATFORM_SUNO_API_KEY:        z.string().optional(),
PLATFORM_MUBERT_API_KEY:      z.string().optional(),
PLATFORM_ELEVENLABS_API_KEY:  z.string().optional(),
PLATFORM_PLAYHT_API_KEY:      z.string().optional(),
PLATFORM_PLAYHT_USER_ID:      z.string().optional(),
PLATFORM_STABILITY_API_KEY:   z.string().optional(),
PLATFORM_FAL_API_KEY:         z.string().optional(),
PLATFORM_WHISPER_API_KEY:     z.string().optional(),
```

---

## FIX 03 — Missing Backend Routes (add to Phase 04 route files)

### 3A — User Data Export Route

Add to `/directorbyte-v2/apps/api/src/routes/users.routes.ts`:

```
GET /api/v1/users/me/export
```

**Logic:**
1. Auth required
2. Collect all user data:
   - User profile (sanitized — no password hash, no tokens)
   - All Projects metadata (not files)
   - All project versions (snapshot JSON)
   - Subscription history
   - API key list (keyHint only — no encrypted values)
   - Support tickets and messages
3. Build a JSON manifest: `{ exportedAt, user, projects, subscription, tickets }`
4. Generate a ZIP file in memory (use `archiver` npm package):
   - `export.json` — the full JSON manifest
   - `projects/[projectId]/metadata.json` per project
5. Set headers: `Content-Disposition: attachment; filename="directorbyte-export-[date].zip"`
6. Stream ZIP to response
7. Log export event (not to AuditLog, just console)

```typescript
// Response: ZIP file stream
// Error: 500 if ZIP generation fails
```

### 3B — Project Thumbnail Route

Add to `/directorbyte-v2/apps/api/src/routes/projects.routes.ts`:

```
POST /api/v1/projects/:id/thumbnail
```

**Body:** `{ imageUrl: string }` (URL of an already-generated keyframe image)

**Logic:**
1. Auth required, verify project belongs to user
2. Fetch the image from the provided URL (must be within user's storage domain)
3. Resize to 640×360 (16:9 thumbnail)
4. Upload to storage provider as `projects/{projectId}/thumbnail.jpg`
5. Update `project.thumbnailUrl` in DB
6. Return: `{ thumbnailUrl: string }`

Also add:
```
DELETE /api/v1/projects/:id/thumbnail
```
- Deletes thumbnail file, sets `thumbnailUrl = null`

### 3C — Transcription Route (Subtitle Generation)

Add to `/directorbyte-v2/apps/api/src/routes/studio.routes.ts`:

```
POST /api/v1/studio/transcribe
```

**Body:** `{ audioUrl: string, language?: string, projectId: string }`

**Logic:**
1. Auth required
2. Check credit balance (transcription costs 5 credits)
3. Resolve which transcription provider to use:
   - If user has a BYO OpenAI key: use it
   - Else if platform key available: use platform OpenAI key (Whisper)
   - Else: return 402 with message "Add an OpenAI API key to use transcription"
4. Fetch audio file from `audioUrl`
5. Send to Whisper API (`openai.audio.transcriptions.create`)
6. Parse response into subtitle segments:
   ```json
   [{ "start": 0.0, "end": 2.5, "text": "Welcome to DirectorByte" }]
   ```
7. Generate SRT and VTT format strings from segments
8. Deduct credits
9. Return:
   ```json
   {
     "segments": [...],
     "srt": "1\n00:00:00,000 --> 00:00:02,500\nWelcome to DirectorByte\n\n...",
     "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nWelcome to DirectorByte\n\n..."
   }
   ```

### 3D — Shared Project Viewer Route (already in Phase 04, but ensure it exists)

Verify this route exists in `projects.routes.ts`:
```
GET /api/v1/projects/shared/:token
```
If missing, add it:
- Public — no auth required
- Lookup project by `shareToken` where `shareEnabled = true`
- If not found or shareEnabled=false: 404
- Return read-only project data: `{ title, description, thumbnailUrl, genre, style, currentStage }`
- Do NOT return `pipelineConfig` (may contain sensitive API data)
- Do NOT return `userId`

---

## FIX 04 — Email Templates DB-Backed Storage

### 4A — Backend Route (add to admin routes)

Add to `/directorbyte-v2/apps/api/src/routes/admin/system.routes.ts`:

```
GET /api/v1/admin/system/email-templates
```
- Returns all EmailTemplate records
- If a template key doesn't have a DB entry yet, return a stub with empty body

```
GET /api/v1/admin/system/email-templates/:key
```
- Returns single template with full htmlBody

```
PATCH /api/v1/admin/system/email-templates/:key
```
- Body: `{ subject?, htmlBody? }`
- Upsert the EmailTemplate record
- Log to AuditLog: `SYSTEM_SETTING_CHANGED` with details: `{ setting: "email_template", key }`

```
POST /api/v1/admin/system/email-templates/:key/preview
```
- Body: `{ variables: Record<string, string> }` (test values for Handlebars vars)
- Render the template with test variables
- Return: `{ renderedHtml: string }`

```
POST /api/v1/admin/system/email-templates/:key/reset
```
- Delete the DB record, reverting to file-based default
- Log to AuditLog

### 4B — Email Service Update

Update `/directorbyte-v2/apps/api/src/services/email.service.ts`:

In the `renderTemplate(templateKey, variables)` function:
1. **First** check DB: `await prisma.emailTemplate.findUnique({ where: { key: templateKey } })`
2. If DB record found AND `isActive=true`: use the DB htmlBody + subject
3. If not found in DB: fall back to file-based `.hbs` template (existing behavior)
4. If DB template rendering fails: fall back to file-based template + log warning

This ensures the admin can customize templates without breaking the app if they save bad HTML.

---

## FIX 05 — Plan-Aware Generation Rate Limiting

Update `/directorbyte-v2/apps/api/src/middleware/rateLimiter.ts`:

Replace the single `generationLimiter` with a plan-aware version:

```typescript
export const generationLimiter = async (req, res, next) => {
  const user = req.user // set by authenticate middleware
  
  // Determine limit based on plan features
  let requestsPerMinute: number
  let requestsPerHour: number
  
  switch (user.planSlug) {
    case 'free':
      requestsPerMinute = 2
      requestsPerHour = 10
      break
    case 'creator':
      requestsPerMinute = 5
      requestsPerHour = 60
      break
    case 'studio':
      requestsPerMinute = 10
      requestsPerHour = 200
      break
    default:
      requestsPerMinute = 2
      requestsPerHour = 10
  }
  
  // Check per-minute limit
  const minuteKey = `gen_limit:min:${user.id}`
  const hourKey = `gen_limit:hr:${user.id}`
  
  const [minuteCount, hourCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(hourKey)
  ])
  
  // Set TTL only on first increment
  if (minuteCount === 1) await redis.expire(minuteKey, 60)
  if (hourCount === 1) await redis.expire(hourKey, 3600)
  
  if (minuteCount > requestsPerMinute) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Generation limit reached: ${requestsPerMinute} per minute on your plan. Upgrade for higher limits.`,
        retryAfter: 60
      }
    })
  }
  
  if (hourCount > requestsPerHour) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Hourly generation limit reached (${requestsPerHour}/hr on your plan). Try again later or upgrade.`,
        retryAfter: 3600
      }
    })
  }
  
  next()
}
```

Note: `user.planSlug` must be included in the JWT payload (update token generation in Phase 03 auth service to include it).

---

## FIX 06 — Admin 2FA Scaffold (TOTP)

> **Note:** Full 2FA is Phase 20+. This fix adds the DB field and a placeholder so Phase 06 admin auth is future-ready.

### 6A — Add to AdminSession model in schema.prisma

```prisma
// Add to AdminSession model:
/// Whether this session was created after TOTP verification
totpVerified Boolean @default(false)
```

### 6B — Add to SystemSetting seed

```typescript
// In systemsettings.seed.ts, add:
{ key: 'admin.require2fa', value: 'false', description: 'Require TOTP for admin login', isSecret: false }
{ key: 'admin.totpSecret', value: '', description: 'Admin TOTP secret (base32 encoded). Empty = 2FA not configured.', isSecret: true }
```

### 6C — Stub route (admin auth)

Add to `/directorbyte-v2/apps/api/src/routes/admin/auth.routes.ts`:

```
POST /api/v1/admin/auth/totp/setup
```
- Admin auth required
- Generates a TOTP secret using `otplib` package
- Returns: `{ secret, qrCodeDataUrl, backupCodes: string[] }`
- Does NOT save yet — must be confirmed first

```
POST /api/v1/admin/auth/totp/verify-setup
```
- Body: `{ totpCode: string, secret: string }`
- Validates the code against the secret
- If valid: save secret to SystemSetting `admin.totpSecret`, enable `admin.require2fa`
- Return: `{ success: true }`

```
POST /api/v1/admin/auth/totp/verify
```
- Body: `{ totpCode: string }`
- Used during login flow after password check (if 2FA is enabled)
- Validates code, marks AdminSession as `totpVerified = true`
- Return: `{ success: true, token }` (issues actual session token only after TOTP pass)

> These routes are stubbed — the UI for setup lives in Phase 15 Admin Settings.
> The login flow in Phase 15 should check `admin.require2fa` and show TOTP step if enabled.

---

## FIX 07 — Shared Project Viewer Frontend Page

This is a frontend fix. Add to the React router in `/directorbyte-v2/apps/web/src/routes`:

### Route: `/shared/:token`

**File:** `/directorbyte-v2/apps/web/src/pages/SharedProject/SharedProjectPage.tsx`

**Behavior:**
- Public page — no auth required
- On mount: call `GET /api/v1/projects/shared/:token`
- Loading state: full-page skeleton
- 404 state: "This project link is no longer valid" message with CTA to home
- Success state: read-only project view

**Layout:**
- Minimal navbar: DirectorByte logo (no user menu)
- Hero section: project thumbnail (if set) or gradient placeholder
- Project title, description, genre, style as metadata chips
- "Current stage" badge showing how far along the project is
- CTA card (bottom): "Create your own AI film — Try DirectorByte Free"
  - Sign in / Sign up buttons
  - Feature highlights (3 bullet points)
- Footer: links to home, pricing, support

**SEO:**
- Meta title: `"[Project Title] — Made with DirectorByte"`
- OG image: project thumbnail URL
- OG description: project description

---

## FIX 08 — Referral System — Explicitly Deferred

Add this comment to the following files so the `referrerId` field intent is clear:

In `schema.prisma` PromoCode model:
```prisma
/// Reserved for future referral system (Phase 20). Currently unused.
referrerId  String?
```

In Phase 15 Admin Center feature flags section, add a note:
```
Referral System: DEFERRED — Phase 20
The DB field referrerId is reserved on PromoCode.
No frontend or backend logic for referrals is included in v2.
This note exists so future developers don't accidentally build on a partial foundation.
```

---

## FIX 09 — Minor Inconsistencies Patch List

Apply these small fixes wherever the relevant code exists:

### 9A — Notification type definitions
Create `/directorbyte-v2/packages/shared/src/notification-types.ts`:
```typescript
export const NotificationTypes = {
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_RENEWAL_FAILED: 'subscription_renewal_failed',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  CREDIT_USAGE_WARNING: 'credit_usage_warning',
  SUPPORT_TICKET_REPLY: 'support_ticket_reply',
  PROJECT_GENERATION_COMPLETE: 'project_generation_complete',
  PROJECT_GENERATION_FAILED: 'project_generation_failed',
  ANNOUNCEMENT: 'announcement',
  STORAGE_WARNING: 'storage_warning',
} as const

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes]
```

Use this enum everywhere a notification type string is used (Phase 07, Phase 04, workers).

### 9B — planSlug in JWT payload
In `/directorbyte-v2/apps/api/src/lib/tokens.ts`, update `generateAccessToken`:
```typescript
// Include planSlug so middleware can make plan-aware decisions without a DB call
generateAccessToken(userId: string, role: UserRole, planSlug: string): string
// Payload: { sub: userId, role, planSlug, iat, exp }
```

Update all callers of `generateAccessToken` to pass the planSlug.
Update `authenticate` middleware to expose `req.user.planSlug`.

### 9C — AuditAction enum additions
Add to the `AuditAction` enum in `schema.prisma`:
```prisma
EMAIL_TEMPLATE_UPDATED
FEATURE_FLAG_CHANGED
SERVICE_KEY_TESTED
USER_DATA_EXPORTED
ADMIN_2FA_SETUP
ADMIN_2FA_DISABLED
```
Run migration after: `npx prisma migrate dev --name add_audit_actions`

---

## Completion Checklist

- [ ] `Notification` model added to schema and migrated
- [ ] `CannedResponse` model added to schema and migrated
- [ ] `EmailTemplate` model added to schema and migrated
- [ ] `User` model has `notifications` relation
- [ ] All new env vars in `.env.example` and validated in `env.ts`
- [ ] `GET /api/v1/users/me/export` route implemented (ZIP download)
- [ ] `POST /api/v1/projects/:id/thumbnail` route implemented
- [ ] `DELETE /api/v1/projects/:id/thumbnail` route implemented
- [ ] `POST /api/v1/studio/transcribe` route implemented (Whisper)
- [ ] `GET /api/v1/projects/shared/:token` route implemented
- [ ] Email template CRUD admin routes implemented (4 routes)
- [ ] Email service updated to check DB before falling back to file templates
- [ ] Plan-aware generation rate limiter implemented
- [ ] `planSlug` included in JWT payload and `req.user`
- [ ] Admin TOTP scaffold routes added (3 routes)
- [ ] `totpVerified` field added to `AdminSession`
- [ ] Admin 2FA system settings seed entries added
- [ ] `/shared/:token` frontend page created
- [ ] `referrerId` field commented as deferred
- [ ] `NotificationTypes` constants file created in shared package
- [ ] New `AuditAction` enum values added and migrated
- [ ] Zero TypeScript errors after all fixes
- [ ] All existing tests (if any) still passing
