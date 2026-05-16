# PHASE 02 — Database Schema, Models & Migrations
> DirectorByte Rebuild · Depends on: PHASE_01 Structure

---

## Objective

Define every database entity the platform needs using Prisma schema.
Generate and run migrations. Create seed data for plans, admin config,
and demo data. Every model must be documented inline.

---

## 2.1 — Core Models Overview

```
User
├── Profile (1:1)
├── Sessions (1:N)
├── ApiKeys (1:N)
├── Projects (1:N)
│   └── ProjectVersions (1:N)
├── Subscription (1:1)
│   └── SubscriptionUsage (1:1)
├── StorageConnection (1:1)      ← Google Drive OAuth
├── SupportTickets (1:N)
│   └── TicketMessages (1:N)
└── AuditLogs (1:N)              ← actions performed on this user

Plan
├── PlanFeatures (1:N)           ← JSON blob per feature
└── Subscriptions (1:N)

PromoCode
└── PromoRedemptions (1:N)

PaymentRecord (1:N per subscription)

SystemSetting (key-value store)

AdminSession

AuditLog (all admin actions)

Announcement

HelpArticle
└── HelpCategory

SupportTicket
└── TicketMessage
└── TicketInternalNote

GenerationJob (async AI jobs)
```

---

## 2.2 — Full Prisma Schema

Write the complete `schema.prisma` with all models, relations, enums,
and inline comments. Every field must include a comment explaining it.

### Enums Required

```prisma
enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  PENDING_VERIFICATION
  DELETED
}

enum UserRole {
  USER
  ADMIN
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  EXPIRED
  PAUSED
}

enum BillingCycle {
  MONTHLY
  ANNUAL
  LIFETIME
  TRIAL
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  WAIVED    // promo code brought price to $0
}

enum PaymentGateway {
  STRIPE
  PADDLE
  RAZORPAY
  MANUAL    // assigned by admin
}

enum StorageProvider {
  LOCAL
  GOOGLE_CLOUD_STORAGE
  GOOGLE_DRIVE
}

enum AIModule {
  CHAT
  SCRIPT
  STORYBOARD
  IMAGE_GEN
  VIDEO_GEN
  AUDIO_GEN
  VOICEOVER
  UPSCALE
  BACKGROUND_REMOVAL
}

enum KeyType {
  USER_PROVIDED    // user's own BYO key
  PLATFORM         // admin-managed platform key
  FREE_TIER        // free provider, no key needed
}

enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  FAILED
}

enum GenerationJobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}

TicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum AuditAction {
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_SUSPENDED
  USER_BANNED
  USER_ENABLED
  PASSWORD_RESET
  IMPERSONATION_START
  IMPERSONATION_END
  SUBSCRIPTION_ASSIGNED
  SUBSCRIPTION_CHANGED
  CREDITS_ADJUSTED
  PROMO_CREATED
  PROMO_UPDATED
  PROMO_DELETED
  PLAN_CREATED
  PLAN_UPDATED
  SYSTEM_SETTING_CHANGED
  API_KEY_UPDATED
  TICKET_REPLIED
  ADMIN_LOGIN
  ADMIN_LOGOUT
}

enum AnnouncementTarget {
  ALL
  FREE_USERS
  PAID_USERS
  SPECIFIC_PLAN
  SPECIFIC_USERS
}

enum HelpArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### All Model Definitions

Generate each model with ALL fields:

**User model fields:**
- id (cuid), email (unique), emailVerified (bool), emailVerificationToken, emailVerificationExpiry
- passwordHash, googleId (for OAuth), googleAccessToken, googleRefreshToken, googleTokenExpiry
- displayName, bio, avatarUrl
- role (UserRole), status (UserStatus)
- lastLoginAt, lastActiveAt, loginAttempts, lockedUntil
- storageProvider (StorageProvider), storageBytesUsed (BigInt)
- createdAt, updatedAt, deletedAt (soft delete)
- Relations: profile, sessions, apiKeys, projects, subscription, storageConnection, supportTickets

**Profile model fields:**
- id, userId (unique FK), timezone, language, theme (light/dark/system)
- emailNotifications (JSON: { projectComplete, billing, announcements, supportReplies })
- defaultExportFormat, autoSaveInterval, defaultPipelineStages (JSON array)
- createdAt, updatedAt

**Session model fields:**
- id (cuid), userId (FK), token (unique), refreshToken (unique)
- userAgent, ipAddress, deviceInfo (JSON)
- expiresAt, lastUsedAt, createdAt
- isAdmin (bool, false by default)

**ApiKey model fields:**
- id, userId (FK), module (AIModule), keyType (KeyType)
- provider (string: "gemini" | "openai" | "anthropic" | "runwayml" | etc.)
- encryptedKey (AES-256 encrypted), keyHint (last 4 chars, for display)
- isActive (bool), lastTestedAt, lastTestStatus (string: "ok" | "error" | null)
- lastTestError (string), createdAt, updatedAt

**Project model fields:**
- id, userId (FK), title, description, thumbnailUrl
- status (ProjectStatus), genre, style, duration (seconds target)
- pipelineConfig (JSON: which stages enabled, settings per stage)
- currentStage (string), lastAutoSavedAt
- storagePath, storageProvider (StorageProvider), storageSizeBytes (BigInt)
- shareToken (unique, nullable), shareEnabled (bool)
- createdAt, updatedAt, archivedAt, deletedAt

**ProjectVersion model fields:**
- id, projectId (FK), version (int), snapshot (JSON: full project state)
- createdAt, triggeredBy (string: "autosave" | "manual" | "stage_complete")

**GenerationJob model fields:**
- id (cuid), projectId (FK), userId (FK), module (AIModule)
- provider (string), model (string)
- status (GenerationJobStatus), progress (int 0-100)
- inputPayload (JSON), outputPayload (JSON, nullable)
- errorMessage, retryCount, maxRetries
- queuedAt, startedAt, completedAt, failedAt
- creditsUsed (int), estimatedCredits (int)

**Plan model fields:**
- id, name (unique), slug (unique), description
- priceMonthly (Decimal), priceAnnual (Decimal), currency (default "USD")
- isActive (bool), isPublic (bool), sortOrder (int)
- trialDays (int, default 0)
- stripePriceIdMonthly, stripePriceIdAnnual (nullable)
- limits (JSON): {
    creditsPerMonth: int,
    storageGb: int,
    maxProjects: int,
    maxExportsPerMonth: int,
    maxCollaborators: int,
    maxFileSizeMb: int
  }
- features (JSON): {
    useManagedKeys: bool,
    googleDriveStorage: bool,
    projectSharing: bool,
    versionHistory: bool,
    prioritySupport: bool,
    apiAccess: bool,
    advancedExport: bool,
    watermarkFree: bool,
    modules: string[]   // which studio modules are enabled
  }
- createdAt, updatedAt

**Subscription model fields:**
- id, userId (unique FK), planId (FK)
- status (SubscriptionStatus), billingCycle (BillingCycle)
- currentPeriodStart, currentPeriodEnd
- canceledAt, cancelAtPeriodEnd (bool)
- trialStart, trialEnd
- gatewaySubscriptionId (external ID from Stripe/Paddle), gateway (PaymentGateway)
- promoCodeId (FK nullable), discountPercent (Decimal nullable), discountFixed (Decimal nullable)
- manuallyAssigned (bool), assignedByAdminId (string nullable)
- gracePeriodEnd (nullable)
- createdAt, updatedAt

**SubscriptionUsage model fields:**
- id, subscriptionId (unique FK), userId (unique FK)
- creditsUsed (int default 0), creditsLimit (int)
- storageUsedBytes (BigInt default 0), storageLimitBytes (BigInt)
- exportsCount (int default 0), exportsLimit (int)
- projectsCount (int default 0), projectsLimit (int)
- periodStart, periodEnd, lastResetAt
- updatedAt

**PaymentRecord model fields:**
- id, subscriptionId (FK), userId (FK)
- gateway (PaymentGateway), gatewayPaymentId (string, nullable for $0 payments)
- amount (Decimal), currency (string), status (PaymentStatus)
- invoiceUrl (nullable), invoicePdf (nullable)
- promoCodeId (FK nullable), discountAmount (Decimal default 0)
- paidAt, failedAt, refundedAt
- metadata (JSON), createdAt

**PromoCode model fields:**
- id, code (unique uppercase), description (admin note)
- discountType (enum: PERCENT | FIXED | TRIAL_DAYS | FREE_UPGRADE)
- discountValue (Decimal), freeUpgradePlanId (FK nullable), trialDays (int nullable)
- appliesToPlanIds (JSON array of plan IDs, empty = all plans)
- maxTotalRedemptions (int, 0 = unlimited), currentRedemptions (int default 0)
- maxPerUser (int default 1)
- startsAt (nullable), expiresAt (nullable)
- isActive (bool), stackable (bool), firstTimeOnly (bool)
- referrerId (FK nullable, for referral tracking)
- createdAt, updatedAt, createdByAdminId (string)

**PromoRedemption model fields:**
- id, promoCodeId (FK), userId (FK), subscriptionId (FK nullable)
- discountApplied (Decimal), redeemedAt

**StorageConnection model fields:**
- id, userId (unique FK), provider (StorageProvider default GOOGLE_DRIVE)
- encryptedAccessToken, encryptedRefreshToken
- expiresAt, quotaBytes (BigInt), usedBytes (BigInt)
- rootFolderId (Drive folder ID), syncEnabled (bool), lastSyncedAt
- createdAt, updatedAt

**SystemSetting model fields:**
- key (unique), value (String — JSON serialized), description
- isSecret (bool — mask in UI), updatedAt, updatedByAdminId

**AdminSession model fields:**
- id, token (unique), ipAddress, userAgent, createdAt, expiresAt

**AuditLog model fields:**
- id, action (AuditAction), adminId (string — stored denormalized)
- targetUserId (nullable), targetResource (nullable string), targetResourceId (nullable)
- details (JSON — full diff or context), ipAddress, userAgent
- createdAt

**Announcement model fields:**
- id, title, body (string/HTML), type (enum: INFO | WARNING | SUCCESS | MAINTENANCE)
- target (AnnouncementTarget), targetPlanId (nullable), targetUserIds (JSON array)
- dismissible (bool), startsAt, expiresAt
- isActive (bool), createdAt, updatedAt, createdByAdminId

**HelpCategory model fields:**
- id, name, slug (unique), description, icon (string), sortOrder, isPublic

**HelpArticle model fields:**
- id, categoryId (FK), title, slug (unique), body (rich text/HTML)
- excerpt, status (HelpArticleStatus), tags (JSON array)
- views (int default 0), helpful (int default 0), notHelpful (int default 0)
- searchable (bool default true)
- publishedAt, createdAt, updatedAt, authorAdminId

**SupportTicket model fields:**
- id, userId (FK), subject, status (TicketStatus), priority (TicketPriority)
- category (string: billing | technical | account | feature | other)
- assignedToAdminId (nullable), lastRepliedAt, firstResponseAt
- slaBreached (bool), autoCloseAt
- createdAt, updatedAt, closedAt

**TicketMessage model fields:**
- id, ticketId (FK), senderType (enum: USER | ADMIN), senderId (string)
- body (text), attachmentUrls (JSON array)
- isRead (bool), createdAt

**TicketInternalNote model fields:**
- id, ticketId (FK), adminId (string), body (text), createdAt

---

## 2.3 — Indexes to Define

Every foreign key gets an index. Additional compound indexes:
- User: (email), (googleId), (status, createdAt), (status, lastActiveAt)
- Session: (userId, expiresAt), (token)
- ApiKey: (userId, module), (userId, isActive)
- Project: (userId, status), (userId, deletedAt), (shareToken)
- GenerationJob: (userId, status), (projectId, status), (status, queuedAt)
- Subscription: (userId), (status, currentPeriodEnd), (gatewaySubscriptionId)
- PromoCode: (code), (isActive, expiresAt)
- AuditLog: (action, createdAt), (targetUserId, createdAt), (adminId, createdAt)
- SupportTicket: (userId, status), (status, priority), (assignedToAdminId, status)

---

## 2.4 — Migrations

Generate Prisma migration for the full schema:
```bash
npx prisma migrate dev --name init_full_schema
```

After migration:
- Verify all tables created in PostgreSQL
- Verify all indexes exist
- Run: `npx prisma generate` to update the client

---

## 2.5 — Seed Data

Create seed files that populate:

**plans.seed.ts** — 3 default plans:
```
Free Plan:
  price: $0/$0, trial: 0 days
  limits: 50 credits/mo, 2GB storage, 5 projects, 10 exports
  features: useManagedKeys=false, modules=[chat,script,storyboard,image_gen]
  
Creator Plan:
  price: $19/mo, $190/yr
  limits: 500 credits/mo, 20GB storage, unlimited projects, 100 exports
  features: useManagedKeys=true, all modules enabled, projectSharing=true

Studio Plan:
  price: $49/mo, $490/yr
  limits: 2000 credits/mo, 100GB storage, unlimited, unlimited exports
  features: all features, prioritySupport=true, apiAccess=true, watermarkFree=true
```

**systemsettings.seed.ts** — default system settings:
```
app.maintenanceMode = false
app.registrationOpen = true
auth.maxLoginAttempts = 5
auth.lockoutDurationMinutes = 30
auth.sessionLifetimeHours = 24
subscription.gracePeriodDays = 3
subscription.renewalReminderDays = [7, 1]
support.autoCloseDays = 7
support.defaultPriority = NORMAL
email.supportAddress = support@directorbyte.com
storage.defaultProvider = local
```

**admin.seed.ts** — log that admin credentials come from env vars

---

## 2.6 — Completion Criteria

- [ ] Full `schema.prisma` with all models, relations, enums, indexes
- [ ] Migration runs cleanly with 0 errors
- [ ] Seed runs cleanly, creates 3 plans and default system settings
- [ ] `npx prisma studio` shows all tables populated correctly
- [ ] TypeScript types generated and importable
- [ ] All models have inline comments explaining each field
