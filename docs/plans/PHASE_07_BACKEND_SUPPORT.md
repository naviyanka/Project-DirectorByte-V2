# PHASE 07 — Backend: Support System, Help Center & Background Jobs
> DirectorByte Rebuild · Depends on: PHASE_06 Admin

---

## Objective

Complete the backend with the support ticket system, help center content API,
notification system, and all background job workers. After this phase the entire
backend is feature-complete.

---

## 7.1 — Support Ticket Routes (`/api/v1/support/tickets/`)

All user routes require authentication.

**POST /api/v1/support/tickets**
- Body: `{ subject, body, category, priority? }`
- category: `billing | technical | account | feature | other`
- Create SupportTicket + first TicketMessage (senderType=USER)
- Set autoCloseAt = now + system_setting(support.autoCloseDays)
- Send support-ticket-received email to user
- Send internal notification to admin (email or webhook)
- Return: ticket object

**GET /api/v1/support/tickets**
- Query: `{ status?, page? }`
- Returns user's own tickets paginated
- Each: `{ id, subject, status, priority, category, lastRepliedAt, createdAt }`

**GET /api/v1/support/tickets/:id**
- Returns full ticket with all messages (non-internal notes only)
- Ordered by createdAt ASC (conversation thread style)
- Mark all unread user messages as read (isRead=true)

**POST /api/v1/support/tickets/:id/reply**
- Body: `{ body, attachments?: string[] }` (attachments are already-uploaded file URLs)
- Validate ticket is not CLOSED
- Create TicketMessage (senderType=USER)
- If status is RESOLVED or WAITING_USER: change back to OPEN
- Reset autoCloseAt
- Return: new message

**POST /api/v1/support/tickets/:id/close**
- User can close their own ticket
- Set status=CLOSED, closedAt=now()
- Return: updated ticket

---

## 7.2 — Admin Support Routes (`/api/v1/admin/support/`)

**GET /api/v1/admin/support/tickets**
- Query: `{ status?, priority?, category?, assignedTo?, search?, page?, perPage? }`
- Full inbox view
- sortBy: priority (urgent first), createdAt, lastRepliedAt

**GET /api/v1/admin/support/tickets/:id**
- Full ticket with ALL messages including admin internal notes
- User info panel: plan, history, previous tickets

**PATCH /api/v1/admin/support/tickets/:id**
- Body: `{ status?, priority?, assignedToAdminId? }`
- Assign to admin, change priority, change status

**POST /api/v1/admin/support/tickets/:id/reply**
- Body: `{ body, attachments? }`
- Create TicketMessage (senderType=ADMIN)
- Set firstResponseAt if this is first admin reply
- Change ticket status to WAITING_USER
- Send support-ticket-reply email to user
- Log to AuditLog

**POST /api/v1/admin/support/tickets/:id/note**
- Body: `{ body }`
- Create TicketInternalNote (only visible to admin)
- Does NOT notify user

**POST /api/v1/admin/support/tickets/:id/close**
- Set status=CLOSED, closedAt=now()
- Optional: send closing email to user

**GET /api/v1/admin/support/metrics**
- Open ticket count by priority
- Avg response time (last 30 days)
- Resolution rate
- Tickets by category
- SLA breach count

**GET /api/v1/admin/support/canned-responses**
All saved canned responses (title + body templates)

**POST /api/v1/admin/support/canned-responses**
- Create canned response

**PATCH /api/v1/admin/support/canned-responses/:id**
**DELETE /api/v1/admin/support/canned-responses/:id**

---

## 7.3 — Help Center Routes

### Public Routes

**GET /api/v1/help/categories**
- All public HelpCategories with article count
- Ordered by sortOrder

**GET /api/v1/help/categories/:slug**
- Category with all published articles (summary, no body)

**GET /api/v1/help/articles/:slug**
- Full article with body
- Increment views counter (debounced — once per session per article)
- Return: `{ article, relatedArticles: [up to 3 same category] }`

**GET /api/v1/help/search**
- Query: `{ q: string }`
- Full-text search across article titles, excerpts, bodies
- Return: ranked results with excerpt snippets

**POST /api/v1/help/articles/:slug/feedback**
- Body: `{ helpful: bool }`
- Increment helpful or notHelpful counter
- Rate limit: 1 vote per user/IP per article

### Admin Help Routes

**GET /api/v1/admin/help/categories** — all categories including private
**POST /api/v1/admin/help/categories** — create
**PATCH /api/v1/admin/help/categories/:id**
**DELETE /api/v1/admin/help/categories/:id**

**GET /api/v1/admin/help/articles** — all articles including drafts
**POST /api/v1/admin/help/articles** — create (starts as DRAFT)
**PATCH /api/v1/admin/help/articles/:id**
**POST /api/v1/admin/help/articles/:id/publish** — set status=PUBLISHED
**POST /api/v1/admin/help/articles/:id/unpublish** — set status=DRAFT
**DELETE /api/v1/admin/help/articles/:id** — soft delete

---

## 7.4 — Notification System

### In-app notifications (future-ready, stored in DB)

Create a simple Notification model:
```
id, userId, type, title, body, link (nullable), isRead, createdAt
```

**GET /api/v1/notifications** — user's unread notifications (last 50)
**POST /api/v1/notifications/read-all** — mark all read
**PATCH /api/v1/notifications/:id/read** — mark one read

Notification types to send:
- `subscription_upgraded` — when plan changes
- `subscription_renewal_failed` — payment failed
- `subscription_expiring` — N days before end
- `credit_usage_warning` — at 80% and 100% usage
- `support_ticket_reply` — admin replied to ticket
- `project_generation_complete` — async job finished
- `project_generation_failed` — async job failed
- `announcement` — new announcement targeting user
- `storage_warning` — at 80% and 95% storage

---

## 7.5 — Background Job Workers

### Queue Setup (`/jobs/queue.ts`)

Create named BullMQ queues:
- `email-queue` — all outbound emails
- `generation-queue` — AI generation jobs
- `cleanup-queue` — file deletion, token cleanup
- `subscription-queue` — renewal checks, usage resets

### email.worker.ts

Processes `email-queue` jobs:
- `send-email` job: `{ to, template, variables }`
- Render template → send via nodemailer → log result
- Retry up to 3 times on SMTP failure
- Exponential backoff: 30s, 2min, 10min

### subscription.worker.ts

**Daily scheduler triggers these jobs:**

`check-expiring-trials` — runs daily at 9am UTC
- Find trials ending in exactly 3 days
- Enqueue trial-ending reminder emails

`check-renewals` — runs daily at 9am UTC
- Find subscriptions ending in 7 days and 1 day
- Enqueue renewal-reminder emails

`check-grace-periods` — runs daily at 6am UTC
- Find subscriptions where gracePeriodEnd < now
- Downgrade to Free plan
- Send downgrade notification
- Enqueue downgrade email

`reset-monthly-usage` — runs on billing period rollover (triggered by webhook mostly)
- For manual/admin-assigned subscriptions: check if currentPeriodEnd < now
- Call resetUsageForPeriod()

`check-auto-close-tickets` — runs daily
- Find tickets where autoCloseAt < now AND status != CLOSED
- Close them, send auto-close email to user

### cleanup.worker.ts

`cleanup-deleted-projects` — runs daily
- Find projects where deletedAt < now - 30 days
- Delete all associated files from storage
- Hard delete DB records

`cleanup-expired-sessions` — runs hourly
- Delete Session records where expiresAt < now

`cleanup-expired-tokens` — runs hourly
- Clear expired emailVerificationTokens and passwordResetTokens

`anonymize-deleted-users` — runs daily
- Find users where status=DELETED AND deletedAt < now - 30 days
- Replace email with hash, clear personal data, keep account shell for audit

### studio.worker.ts

Processes `generation-queue` jobs (AI generation):
Each job: `{ jobId, userId, projectId, module, provider, model, inputPayload }`

Worker logic:
1. Update GenerationJob.status = PROCESSING, startedAt = now
2. Resolve which API key to use:
   - If user's plan uses managed keys: use platform key
   - If user has BYO key for this module: decrypt and use that
   - Else if free tier available: use free config
3. Call provider with input payload
4. Update progress periodically (for streaming providers)
5. On success: update status=COMPLETED, outputPayload, completedAt, creditsUsed
6. Deduct credits from SubscriptionUsage
7. Send in-app notification: `project_generation_complete`
8. Enqueue email if user has emailNotifications.projectComplete=true
9. On failure: retry up to maxRetries times, then status=FAILED, errorMessage
10. Send in-app notification: `project_generation_failed`

---

## 7.6 — AI Provider Abstraction Layer (`/providers/ai/`)

### provider.interface.ts
```typescript
interface AIProvider {
  name: string
  module: AIModule
  
  // Chat / Script generation
  chat?(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>
  
  // Image generation (keyframes, storyboard frames)
  generateImage?(prompt: string, options: ImageOptions): Promise<ImageResponse>
  
  // Video generation
  generateVideo?(prompt: string, options: VideoOptions): Promise<VideoJobResponse>
  pollVideoJob?(jobId: string): Promise<VideoJobResponse>
  
  // Audio generation
  generateAudio?(prompt: string, options: AudioOptions): Promise<AudioResponse>
  
  // Text-to-speech
  synthesizeSpeech?(text: string, options: TTSOptions): Promise<AudioResponse>
  
  // Validate key (cheapest possible call)
  validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
  
  // Cost estimation
  estimateCredits(operation: string, params: unknown): number
}
```

### Providers to implement initially:
- `gemini.provider.ts` — chat, image gen (Imagen), TTS (Google TTS)
- `openai.provider.ts` — chat, image gen (DALL-E), TTS
- `anthropic.provider.ts` — chat only
- `stability.provider.ts` — image gen (Stable Diffusion)

### provider.factory.ts
```typescript
getProvider(providerName: string, apiKey: string): AIProvider
// Returns instantiated provider with key injected
// Throws if provider not found
```

---

## 7.7 — Completion Criteria

- [ ] Support ticket full lifecycle works (create, reply, close from both sides)
- [ ] Admin can reply, add notes, assign, change priority
- [ ] Admin reply sends email to user
- [ ] Auto-close job runs and closes idle tickets
- [ ] Help articles CRUD with publish/draft workflow
- [ ] Help search returns ranked results
- [ ] All background job queues registered and processing
- [ ] Email worker retries on failure
- [ ] Daily subscription jobs: expiry reminders, grace period downgrade
- [ ] Cleanup jobs remove expired sessions and deleted project files
- [ ] Studio worker resolves correct API key (managed vs BYO vs free)
- [ ] AI provider factory returns correct provider by name
- [ ] Notifications created for key events
- [ ] GET /api/v1/notifications works for authenticated users
- [ ] Zero TypeScript errors
- [ ] Backend is now feature-complete — ready for frontend phases
