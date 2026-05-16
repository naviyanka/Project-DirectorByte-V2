# PHASE 04 — Backend: Users, Projects, API Keys & Storage
> DirectorByte Rebuild · Depends on: PHASE_03 Auth & Core

---

## Objective

Build all user-facing backend routes: user profile management,
project CRUD, API key management with encryption, and storage
(local + Google Drive). This is everything a logged-in user can do
with their own account and projects.

---

## 4.1 — User Routes (`/api/v1/users/`)

All routes require authentication middleware.

### Profile

**GET /api/v1/users/me**
Returns full user profile:
```json
{
  "id", "email", "displayName", "bio", "avatarUrl",
  "emailVerified", "role", "status", "lastLoginAt",
  "createdAt",
  "profile": { timezone, language, theme, emailNotifications,
               defaultExportFormat, autoSaveInterval },
  "subscription": {
    "planName", "planSlug", "status", "billingCycle",
    "currentPeriodEnd", "cancelAtPeriodEnd",
    "usage": { creditsUsed, creditsLimit, storageUsedBytes,
               storageLimitBytes, exportsCount, exportsLimit }
  },
  "storageConnected": bool,
  "storageProvider": "local" | "google_drive" | "gcs"
}
```

**PATCH /api/v1/users/me**
- Body: `{ displayName?, bio?, avatarUrl? }`
- Validate field lengths
- Return: updated user object

**PATCH /api/v1/users/me/profile**
- Body: any Profile fields (timezone, language, theme, notifications, etc.)
- Merge with existing profile (partial update)
- Return: updated profile

**PUT /api/v1/users/me/email**
- Body: `{ newEmail, password }` (verify identity first)
- Check new email not already taken
- Send verification to new email
- Email stays unchanged until verified
- Return: `{ message: "Verify your new email to confirm the change" }`

**PUT /api/v1/users/me/password**
- Body: `{ currentPassword, newPassword }`
- Verify current password
- Validate new password strength
- Update hash, invalidate all OTHER sessions (keep current)
- Send password-changed email
- Return: `{ success: true }`

**POST /api/v1/users/me/avatar**
- Multipart form: image file (max 5MB, jpg/png/webp)
- Resize to 256x256, 512x512 versions
- Store to configured storage provider
- Update user.avatarUrl
- Return: `{ avatarUrl }`

**DELETE /api/v1/users/me/avatar**
- Remove avatar file from storage
- Set avatarUrl to null
- Return: `{ success: true }`

**DELETE /api/v1/users/me**
- Body: `{ password, confirmation: "DELETE" }`
- Verify password
- Verify confirmation string
- Soft delete: set status=DELETED, deletedAt=now()
- Cancel active subscription (end of period)
- Revoke Google tokens
- Anonymize personal data after 30 days (background job)
- Log out all sessions
- Send account deletion confirmation email
- Return: `{ message: "Account scheduled for deletion" }`

### Sessions

**GET /api/v1/users/me/sessions**
Returns all active sessions:
```json
[{ "id", "userAgent", "ipAddress", "deviceInfo",
   "lastUsedAt", "createdAt", "isCurrent": bool }]
```

**DELETE /api/v1/users/me/sessions/:sessionId**
- Terminate a specific session
- Cannot terminate current session (use logout instead)

---

## 4.2 — API Key Management Routes (`/api/v1/api-keys/`)

All routes require authentication. Keys are NEVER returned decrypted.

### Key display rules
- `encryptedKey` is never sent to frontend
- Send only: `{ id, module, provider, keyType, keyHint, isActive, lastTestedAt, lastTestStatus, lastTestError }`
- keyHint: last 4 characters of the original key (stored at creation time)

**GET /api/v1/api-keys**
Returns all API key entries for the user, grouped by module:
```json
{
  "CHAT": [{ id, provider, keyType, keyHint, isActive, lastTestStatus }],
  "IMAGE_GEN": [...],
  "VIDEO_GEN": [...],
  ...
}
```

**POST /api/v1/api-keys**
- Body: `{ module: AIModule, provider: string, apiKey: string }`
- Validate module is a valid AIModule enum value
- Validate provider is a known provider string for that module
- Derive keyHint from last 4 chars of apiKey
- Encrypt apiKey with AES-256 using ENCRYPTION_KEY env var
- Store encrypted, store keyHint
- Deactivate any existing key for same (userId, module, provider)
- Do NOT test the key automatically (let user trigger test)
- Return: key record (without encrypted value)

**PATCH /api/v1/api-keys/:id**
- Body: `{ apiKey?, isActive?, provider? }`
- If apiKey provided: re-encrypt, update keyHint
- Verify key belongs to requesting user
- Return: updated key record

**DELETE /api/v1/api-keys/:id**
- Verify key belongs to requesting user
- Hard delete (keys shouldn't be soft-deleted)
- Return: `{ success: true }`

**POST /api/v1/api-keys/:id/test**
- Decrypt key from DB
- Call provider's cheapest validation endpoint
- Update lastTestedAt, lastTestStatus, lastTestError
- Return: `{ status: "ok" | "error", message: string, latencyMs: number }`
- Do NOT include the key in the response

### Provider Registry

**GET /api/v1/api-keys/providers**
Returns the registry of supported providers per module:
```json
{
  "CHAT": [
    { "id": "gemini", "name": "Google Gemini", "models": ["gemini-1.5-pro", "gemini-2.0-flash"], "isFree": false, "docUrl": "..." },
    { "id": "openai", "name": "OpenAI", "models": ["gpt-4o", "gpt-4-turbo"], "isFree": false },
    { "id": "anthropic", "name": "Anthropic Claude", "models": ["claude-3-5-sonnet"], "isFree": false },
    { "id": "gemini-free", "name": "Gemini (Free Tier)", "isFree": true, "requiresKey": true, "freeQuota": "..." }
  ],
  "IMAGE_GEN": [...],
  "VIDEO_GEN": [...],
  "AUDIO_GEN": [...],
  "VOICEOVER": [...]
}
```
This registry is defined in a config file (not hardcoded in the route).
Adding new providers = adding to the config file only.

---

## 4.3 — Project Routes (`/api/v1/projects/`)

**GET /api/v1/projects**
- Query params: `status?, search?, page?, perPage?, sortBy?, sortOrder?`
- Returns paginated list of user's non-deleted projects
- Each item: `{ id, title, description, thumbnailUrl, status, currentStage, createdAt, updatedAt, storageSize }`

**POST /api/v1/projects**
- Body: `{ title, description?, genre?, style?, duration?, pipelineConfig? }`
- Check user's project limit (from SubscriptionUsage)
- Create Project record
- Increment usage counter
- Return: full project object

**GET /api/v1/projects/:id**
- Verify project belongs to user (or shareToken if public)
- Return: full project with pipelineConfig

**PATCH /api/v1/projects/:id**
- Body: any editable Project fields
- Update updatedAt
- Return: updated project

**DELETE /api/v1/projects/:id**
- Soft delete (set deletedAt)
- Decrement usage counter
- Do NOT delete files immediately (30-day grace period, background job)
- Return: `{ success: true }`

**POST /api/v1/projects/:id/restore**
- If deleted within 30 days, restore it
- Clear deletedAt, re-increment usage counter
- Return: restored project

**POST /api/v1/projects/:id/duplicate**
- Create new project with same config but new title ("Copy of X")
- Copy metadata only, not generated files (too expensive)
- Check project limit
- Return: new project object

**POST /api/v1/projects/:id/archive**
- Set status = ARCHIVED
- Return: updated project

**POST /api/v1/projects/:id/unarchive**
- Set status = DRAFT
- Return: updated project

**POST /api/v1/projects/:id/autosave**
- Body: `{ snapshot: JSON }` (full client-side project state)
- Create ProjectVersion record (limit to last 50 per project)
- Update project.lastAutoSavedAt
- Return: `{ versionId }`

**GET /api/v1/projects/:id/versions**
- Returns list of versions: `[{ id, version, triggeredBy, createdAt }]`

**GET /api/v1/projects/:id/versions/:versionId**
- Returns full snapshot JSON for that version

**POST /api/v1/projects/:id/versions/:versionId/restore**
- Set project state to this snapshot
- Create a new version before restoring (safety snapshot)
- Return: `{ success: true }`

**POST /api/v1/projects/:id/share**
- Generate or return existing shareToken
- Set shareEnabled = true
- Return: `{ shareUrl: "https://app.directorbyte.com/shared/TOKEN" }`

**DELETE /api/v1/projects/:id/share**
- Set shareEnabled = false, clear shareToken
- Return: `{ success: true }`

**GET /api/v1/projects/shared/:token**
- Public route (no auth)
- Check shareEnabled = true
- Return: read-only project view data

---

## 4.4 — Storage Routes (`/api/v1/storage/`)

**GET /api/v1/storage/status**
- Returns current storage config for user:
```json
{
  "provider": "google_drive",
  "connected": true,
  "quotaBytes": 15000000000,
  "usedBytes": 2400000000,
  "usedByApp": 800000000,
  "syncEnabled": true,
  "lastSyncedAt": "..."
}
```

**POST /api/v1/storage/provider**
- Body: `{ provider: "local" | "google_drive" }`
- If google_drive: verify StorageConnection exists for user
- Update user.storageProvider
- Return: updated status

**POST /api/v1/storage/sync**
- Trigger immediate Drive sync for user's projects
- Enqueue background job
- Return: `{ jobId, status: "queued" }`

**POST /api/v1/storage/upload**
- Multipart file upload
- Validate file type + size against plan limits
- Upload to user's configured storage provider
- Track bytes used in SubscriptionUsage
- Return: `{ fileId, url, sizeBytes, provider }`

**DELETE /api/v1/storage/files/:fileId**
- Delete file from storage provider
- Decrement storageBytesUsed
- Return: `{ success: true }`

---

## 4.5 — Encryption Service (`/services/encryption.service.ts`)

All API key encryption lives here. Never scattered in routes.

```typescript
encrypt(plaintext: string): string  // returns base64 ciphertext
decrypt(ciphertext: string): string // returns original key
// Uses AES-256-GCM with random IV prepended to ciphertext
// ENCRYPTION_KEY from env (must be exactly 32 bytes)
// IV is random per encryption (stored with ciphertext)
```

Testing:
- Encrypt and decrypt a known key string, verify round-trip
- Verify different calls to encrypt() produce different ciphertext (random IV)
- Verify wrong key throws on decrypt

---

## 4.6 — Generation Jobs Routes (`/api/v1/studio/`)

(Studio generation logic is in Phase 11, but the job tracking routes live here)

**GET /api/v1/studio/jobs**
- Query: `{ status?, projectId?, module?, page? }`
- Returns paginated job list

**GET /api/v1/studio/jobs/:jobId**
- Returns job status, progress, output (if complete)

**DELETE /api/v1/studio/jobs/:jobId**
- Cancel a queued/processing job
- Only if job belongs to user
- Return: `{ success: true }`

---

## 4.7 — Completion Criteria

- [ ] All user profile endpoints work with auth
- [ ] API key creation encrypts key, never returns plain value
- [ ] API key test endpoint correctly calls providers and returns status
- [ ] Provider registry endpoint returns complete list
- [ ] Project CRUD works with usage limit enforcement
- [ ] Version history saves and restores correctly
- [ ] Project sharing generates usable public link
- [ ] Storage status returns correct info
- [ ] File upload routes with storage provider routing
- [ ] All endpoints validated with Zod schemas
- [ ] Zero TypeScript errors
