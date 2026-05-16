# PHASE 06 — Backend: Admin Center API
> DirectorByte Rebuild · Depends on: PHASE_05 Subscriptions

---

## Objective

Build all admin-only backend routes. Every route in this phase is
protected by `adminAuth` middleware. All destructive or significant
actions are wrapped in `auditLogger` middleware.

---

## 6.1 — Admin Auth Routes (`/api/v1/admin/auth/`)

**POST /api/v1/admin/auth/login**
- Body: `{ username, password }`
- Compare against `env.ADMIN_USERNAME` and bcrypt verify against `env.ADMIN_PASSWORD_HASH`
- Rate limit: 5 attempts / 15 minutes / IP
- On success: create AdminSession record (4-hour expiry), return `{ token }`
- On failure: increment failed counter, return generic 401
- Log: all attempts (success and failure) with IP

**POST /api/v1/admin/auth/logout**
- Admin auth required
- Delete AdminSession record
- Return: `{ success: true }`

**GET /api/v1/admin/auth/me**
- Admin auth required
- Return: `{ username, sessionId, loggedInAt, expiresAt }`

---

## 6.2 — Admin Dashboard Routes (`/api/v1/admin/dashboard/`)

**GET /api/v1/admin/dashboard/kpis**
Returns:
```json
{
  "users": {
    "total": int,
    "active24h": int,
    "active7d": int,
    "active30d": int,
    "newToday": int,
    "newThisMonth": int,
    "pendingVerification": int
  },
  "subscriptions": {
    "active": int,
    "trialing": int,
    "pastDue": int,
    "canceled": int,
    "mrrCents": int,
    "arrCents": int,
    "churnRatePercent": float,
    "byPlan": [{ "planName", "count", "mrr" }]
  },
  "usage": {
    "totalCreditsUsedThisMonth": int,
    "totalStorageUsedBytes": BigInt,
    "generationJobsToday": int,
    "generationJobsThisMonth": int
  },
  "support": {
    "openTickets": int,
    "urgentTickets": int,
    "avgResponseHours": float
  },
  "system": {
    "dbStatus": "ok" | "degraded",
    "redisStatus": "ok" | "degraded",
    "storageStatus": "ok" | "degraded",
    "queueDepth": int
  }
}
```

**GET /api/v1/admin/dashboard/charts**
- Query: `{ metric: string, period: "7d"|"30d"|"90d"|"1y" }`
- Metric options: `user_growth`, `revenue`, `new_signups`, `generation_volume`, `storage_growth`, `plan_distribution`
- Returns: `{ labels: string[], data: number[] }` (daily/weekly data points)

**GET /api/v1/admin/dashboard/activity**
- Returns last 30 significant platform events with timestamps
- Events: new signups, upgrades, downgrades, cancellations, new tickets

---

## 6.3 — Admin User Management (`/api/v1/admin/users/`)

**GET /api/v1/admin/users**
- Query: `{ search?, status?, plan?, sortBy?, sortOrder?, page?, perPage? }`
- Filterable by: email, displayName, status (ACTIVE/SUSPENDED/BANNED), plan slug
- Sortable by: email, createdAt, lastLoginAt, storageUsed, plan
- Returns paginated results with subscription summary per user

**GET /api/v1/admin/users/:id**
Returns full user detail including:
- All Profile fields
- All sessions (active)
- All ApiKey entries (masked)
- Full Subscription + usage
- All Projects (count + list)
- All SupportTickets
- AuditLog entries targeting this user
- StorageConnection info

**PATCH /api/v1/admin/users/:id**
- Body: `{ displayName?, bio?, status?, emailVerified? }`
- Log action to AuditLog

**POST /api/v1/admin/users/:id/suspend**
- Body: `{ reason?: string }`
- Set status=SUSPENDED, terminate all sessions
- Send account-suspended email (with reason if provided)
- Log to AuditLog

**POST /api/v1/admin/users/:id/ban**
- Body: `{ reason?: string, permanent?: bool }`
- Set status=BANNED, terminate all sessions
- Log to AuditLog

**POST /api/v1/admin/users/:id/enable**
- Set status=ACTIVE
- Log to AuditLog

**POST /api/v1/admin/users/:id/reset-password**
- Body: `{ method: "email" | "set", newPassword? }`
- If email: trigger forgot-password flow for this user
- If set: directly update password hash, invalidate all sessions
- Log to AuditLog

**POST /api/v1/admin/users/:id/impersonate**
- Create a special impersonation token for this user
- Token has short expiry (1 hour) and impersonation flag
- Log to AuditLog with adminId
- Return: `{ impersonationToken }` (frontend will use this to sign in as user)
- All actions taken while impersonating are tagged in logs

**DELETE /api/v1/admin/users/:id/impersonate**
- End impersonation session
- Log to AuditLog

**POST /api/v1/admin/users/:id/send-email**
- Body: `{ subject, body }` (plain text or HTML)
- Send direct email to this user
- Log to AuditLog

**DELETE /api/v1/admin/users/:id/sessions/:sessionId**
- Terminate a specific user session
- Log to AuditLog

**DELETE /api/v1/admin/users/:id/sessions**
- Terminate ALL sessions for this user
- Log to AuditLog

---

## 6.4 — Admin Subscription Management (`/api/v1/admin/subscriptions/`)

**GET /api/v1/admin/subscriptions**
- List all subscriptions with user + plan info
- Filterable by: status, plan, billingCycle, gateway, hasPromo

**PATCH /api/v1/admin/subscriptions/:id**
- Body: `{ planId?, status?, billingCycle?, currentPeriodEnd?, cancelAtPeriodEnd? }`
- Override any subscription field manually
- If planId changes: update limits, usage caps
- Log to AuditLog

**POST /api/v1/admin/subscriptions/assign**
- Body: `{ userId, planId, billingCycle, durationDays?, reason? }`
- Manually assign a plan to a user
- Creates subscription with `manuallyAssigned=true, assignedByAdminId`
- No payment required
- If durationDays: set custom expiry
- Log to AuditLog

**POST /api/v1/admin/subscriptions/:id/adjust-credits**
- Body: `{ amount: int, reason: string }` (positive = add, negative = remove)
- Updates SubscriptionUsage.creditsUsed (clamped to 0 and limit)
- Log to AuditLog

---

## 6.5 — Admin Plan Management (`/api/v1/admin/plans/`)

**GET /api/v1/admin/plans**
- All plans including private/inactive ones
- Includes subscriber count per plan

**POST /api/v1/admin/plans**
- Body: full plan object (name, slug, price, limits, features, etc.)
- Validate slug uniqueness
- Return: created plan

**PATCH /api/v1/admin/plans/:id**
- Any plan field editable
- If changing price: update Stripe price IDs
- Note: changing limits affects existing subscribers immediately
- Log to AuditLog

**POST /api/v1/admin/plans/:id/archive**
- Set `isActive=false, isPublic=false`
- Existing subscribers not affected
- Log to AuditLog

**POST /api/v1/admin/plans/:id/duplicate**
- Clone plan with "(Copy)" suffix
- Return: new plan

---

## 6.6 — Admin Promo Code Management (`/api/v1/admin/promo-codes/`)

**GET /api/v1/admin/promo-codes**
- All promo codes with redemption counts and revenue impact
- Filterable by: isActive, discountType, expiresAt

**POST /api/v1/admin/promo-codes**
- Body: full promo code object
- Auto-uppercase the code string
- Validate: expiresAt > startsAt if both set
- Return: created promo code + unique shareable URL

**PATCH /api/v1/admin/promo-codes/:id**
- Edit any non-destructive field (can't change discount type/value of live code)
- Log to AuditLog

**DELETE /api/v1/admin/promo-codes/:id**
- Soft deactivate (set isActive=false)
- Cannot hard delete if redemptions exist
- Log to AuditLog

**GET /api/v1/admin/promo-codes/:id/redemptions**
- List all PromoRedemption records for this code
- Includes: userId, userEmail, subscriptionId, discountApplied, redeemedAt

**POST /api/v1/admin/promo-codes/generate-bulk**
- Body: `{ count: int, prefix?: string, ...otherPromoFields }`
- Generate N unique codes with shared settings
- Return: array of generated codes

---

## 6.7 — Admin API & Services Management (`/api/v1/admin/services/`)

**GET /api/v1/admin/services**
Returns all platform-level service configs (keys masked):
```json
{
  "aiProviders": [
    { "id", "name", "module", "isActive", "keyHint", "lastTested",
      "lastTestStatus", "model", "usageToday", "usageThisMonth",
      "estimatedCostUsd", "monthlyBudgetCapUsd" }
  ],
  "storage": { "provider", "bucket", "status", "usageBytes" },
  "payment": { "gateway", "isLiveMode", "webhookStatus" },
  "email": { "host", "port", "from", "status" }
}
```

**PATCH /api/v1/admin/services/ai/:providerId**
- Body: `{ apiKey?, backupApiKey?, model?, isActive?, monthlyBudgetCapUsd? }`
- Encrypt and store new key
- Log to AuditLog

**POST /api/v1/admin/services/ai/:providerId/test**
- Test platform-level key for this provider
- Return: `{ status, latencyMs, error? }`

**PATCH /api/v1/admin/services/payment**
- Body: `{ gateway?, secretKey?, webhookSecret?, isLiveMode? }`
- Validate gateway is a supported value
- Log to AuditLog

**PATCH /api/v1/admin/services/email**
- Body: SMTP config fields
- Attempt to send test email on save
- Log to AuditLog

**PATCH /api/v1/admin/services/storage**
- Body: `{ provider?, bucket?, keyFilePath? }`
- Log to AuditLog

---

## 6.8 — Admin System Settings (`/api/v1/admin/system/`)

**GET /api/v1/admin/system/settings**
- Returns all SystemSetting records
- Mask `isSecret=true` values (show "••••••" to admin)

**PATCH /api/v1/admin/system/settings**
- Body: `{ key: string, value: string }`
- Upsert setting by key
- Validate value format for known keys
- Log to AuditLog

**POST /api/v1/admin/system/maintenance**
- Body: `{ enabled: bool, message?: string }`
- Set app.maintenanceMode setting
- Logged — users will see maintenance page

**GET /api/v1/admin/system/health**
- Detailed health: DB, Redis, Storage, Email, Payment gateway connectivity
- Queue depths, background job statuses
- Recent error rate (last 1 hour)

**POST /api/v1/admin/system/email/test**
- Body: `{ to: string }`
- Send test email to verify SMTP config

**GET /api/v1/admin/system/feature-flags**
- All feature flags from SystemSettings with bool values

**PATCH /api/v1/admin/system/feature-flags/:flag**
- Body: `{ enabled: bool }`
- Immediately toggles feature app-wide without redeploy
- Log to AuditLog

---

## 6.9 — Admin Audit Log (`/api/v1/admin/audit/`)

**GET /api/v1/admin/audit**
- Query: `{ action?, adminId?, targetUserId?, startDate?, endDate?, page?, perPage? }`
- Returns paginated AuditLog entries
- Each entry: `{ id, action, adminId, targetUserId, targetResource, details, ipAddress, createdAt }`

**GET /api/v1/admin/audit/export**
- Query: same filters as above
- Returns CSV file download
- Maximum 10,000 rows per export

---

## 6.10 — Admin Announcement Management (`/api/v1/admin/announcements/`)

**GET /api/v1/admin/announcements** — all announcements
**POST /api/v1/admin/announcements** — create announcement
**PATCH /api/v1/admin/announcements/:id** — edit
**DELETE /api/v1/admin/announcements/:id** — delete (if not live)
**POST /api/v1/admin/announcements/:id/activate** — publish
**POST /api/v1/admin/announcements/:id/deactivate** — unpublish

**GET /api/v1/announcements** (user-facing, authenticated)
- Returns active announcements targeted at this user
- Filtered by: target matches user's plan, not yet dismissed
- User dismissal tracked in their Profile (JSON array of dismissed IDs)

---

## 6.11 — Completion Criteria

- [ ] Admin login/logout works, session stored in DB
- [ ] Admin session separate from user JWT, cannot be used on user routes
- [ ] Dashboard KPIs return real calculated values
- [ ] User management: list, detail, suspend, ban, enable, impersonate all work
- [ ] Password reset via admin works (both email and direct set)
- [ ] Subscription assign and adjust-credits work with audit logging
- [ ] Plan CRUD works, archive doesn't break existing subscribers
- [ ] Promo code CRUD with redemption listing works
- [ ] Platform API key update, encrypt, test works
- [ ] System settings CRUD works, feature flags toggle immediately
- [ ] Audit log records every admin action with correct details
- [ ] AuditLog CSV export works
- [ ] All admin routes return 401 without valid admin session
- [ ] Zero TypeScript errors
