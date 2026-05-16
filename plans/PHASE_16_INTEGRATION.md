# PHASE 16 — Integration: Wire Frontend ↔ Backend, OAuth, Drive & AI Providers
> DirectorByte Rebuild · Depends on: PHASE_15 (Admin Center Complete)

---

## Objective

All previous phases built the backend and frontend independently with placeholder
data, mock services, and stubbed API calls. This phase connects everything:
real API calls replacing mocks, Google OAuth and Drive fully wired end-to-end,
AI providers resolving correctly per user plan and key configuration, payment
webhooks tested against real Stripe events, and all real-time features activated.

At the end of this phase, DirectorByte is a fully functional application.

---

## 16.1 — API Client Hardening (`/apps/web/src/lib/axios.ts`)

The Axios instance needs to be production-ready before wiring any features.

### Base configuration
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,   // e.g. http://localhost:4000/api/v1
  timeout: 30_000,
  withCredentials: true,   // CRITICAL: sends HttpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': APP_VERSION,
  },
})
```

### Request interceptor — attach access token
```typescript
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Response interceptor — handle 401 with token refresh
```typescript
let isRefreshing = false
let failedQueue: Array<{ resolve; reject }> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { accessToken } = await authService.refreshToken()
        useAuthStore.getState().setToken(accessToken)
        // Flush queued requests
        failedQueue.forEach(({ resolve }) => resolve(accessToken))
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        // Refresh failed — logout
        failedQueue.forEach(({ reject }) => reject(error))
        useAuthStore.getState().logout()
        window.location.href = '/signin'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
        failedQueue = []
      }
    }

    return Promise.reject(error)
  }
)
```

### Error normalization
All API errors normalized to a consistent shape before reaching components:
```typescript
// In response interceptor error handler:
const normalized = {
  status: error.response?.status ?? 0,
  code: error.response?.data?.error?.code ?? 'NETWORK_ERROR',
  message: error.response?.data?.error?.message ?? 'Network error',
  fields: error.response?.data?.error?.fields ?? {},
}
throw new ApiError(normalized)
```

Create `ApiError` class extending `Error` with the above shape.
All service functions catch and re-throw as `ApiError` — never raw axios errors.

---

## 16.2 — Auth Integration

### 16.2.1 — Email/Password flow (end-to-end)

Replace all auth service stubs with real API calls:

**Register:**
```typescript
// POST /api/v1/auth/register
// On 201: navigate to /verify-email?email={email}
// On 409 (email taken): set field error on email input
// On 422: map field errors from response.error.fields to form fields
```

**Login:**
```typescript
// POST /api/v1/auth/login
// Response: { accessToken, refreshToken (in cookie), user }
// Store: useAuthStore.setUser(user), useAuthStore.setToken(accessToken)
// refreshToken is HttpOnly cookie — no frontend handling needed
// Navigate: to returnTo URL from session storage, or /home
```

**Logout:**
```typescript
// POST /api/v1/auth/logout
// Clears server session, clears auth.store, clears React Query cache
// queryClient.clear() on logout to prevent stale data leaks
```

**Token refresh on app load:**
```typescript
// In App.tsx useEffect on mount:
// 1. Call POST /api/v1/auth/refresh (cookie sent automatically)
// 2. If 200: store new accessToken, mark isAuthenticated=true
// 3. If 401: mark isAuthenticated=false (stay on guest pages)
// 4. isLoading=true during this check (show splash screen)
// Critical: ALL protected routes must wait for this check to complete
```

### 16.2.2 — Google OAuth (end-to-end)

The OAuth flow involves a full browser redirect cycle. Wire it carefully:

**Step 1 — Initiation:**
```typescript
// User clicks "Continue with Google"
// Redirect browser to: GET /api/v1/auth/google
// This backend route generates Google OAuth URL with:
//   - client_id, redirect_uri, response_type=code
//   - scope: openid email profile
//   - state: base64({returnTo, nonce}) for CSRF protection
// Browser redirects to Google consent
```

**Step 2 — Google callback (backend):**
```typescript
// GET /api/v1/auth/google/callback?code=...&state=...
// Backend:
//   1. Verify state nonce matches (CSRF check)
//   2. Exchange code for tokens via Google Token endpoint
//   3. Fetch user profile from Google
//   4. Upsert user in DB
//   5. Create session, generate accessToken
//   6. Set refreshToken as HttpOnly cookie
//   7. Redirect to: FRONTEND_URL/oauth/callback?token=ACCESS_TOKEN&new=true/false
```

**Step 3 — Frontend callback page:**
```typescript
// Route: /oauth/callback
// On mount:
//   1. Parse token from URL search params
//   2. Clear token from URL (replaceState) to prevent sharing
//   3. Fetch user profile: GET /api/v1/users/me
//   4. Store in auth.store
//   5. If ?new=true → navigate to /onboarding
//   6. If ?new=false → navigate to /home (or returnTo)
// Error handling: if no token in URL → navigate to /oauth/error
```

**Admin impersonation token flow:**
```typescript
// Admin clicks "Sign in as user" in admin panel
// Backend returns { impersonationToken }
// Admin frontend stores token separately in admin.store
// Opens new browser tab with: /impersonate?token=...
// Frontend reads token, fetches user, shows app as that user
// Persistent banner at top: "Impersonating [user] — [Exit]"
// Exit: closes tab or navigates to /admin/users
```

---

## 16.3 — Google Drive Integration (end-to-end)

Drive integration has two parts: OAuth to authorize access, and runtime file operations.

### 16.3.1 — Drive OAuth (connect flow)

**Trigger:** user clicks "Connect Google Drive" in:
- Onboarding step 4
- Settings > Storage > Google Drive card

**Flow:**
```typescript
// 1. Frontend: POST /api/v1/auth/google/drive-connect
// 2. Backend returns { authUrl }
//    (Google OAuth URL with drive.file scope, access_type=offline, prompt=consent)
// 3. Frontend: window.location.href = authUrl (or popup if preferred)
// 4. Google redirects to: /api/v1/auth/google/drive-callback (separate callback)
// 5. Backend:
//    - Exchange code for drive tokens
//    - Encrypt and store in StorageConnection table
//    - Fetch Drive quota info
//    - Redirect to: FRONTEND_URL/settings/storage?drive=connected
// 6. Frontend /settings/storage page:
//    - Detects ?drive=connected query param
//    - Shows success toast "Google Drive connected"
//    - Refreshes storage status
```

### 16.3.2 — Drive disconnect

```typescript
// DELETE /api/v1/auth/google/drive-disconnect
// Backend: revokes Drive tokens at Google, deletes StorageConnection
// Frontend: refresh storage status, show "Google Drive disconnected" toast
// If user had drive as storage provider: auto-switch to local
```

### 16.3.3 — Drive file operations (runtime)

When user's storage provider is `google_drive`, all file operations route through
the Drive storage adapter on the backend. Frontend is unaware — it only calls
generic storage endpoints. The backend's `storage.factory.ts` resolves the
correct adapter. Verify this works for:

- [ ] Avatar upload: uploads to Drive in `/DirectorByte/avatars/`
- [ ] Project file save: saves to `/DirectorByte/projects/{projectId}/`
- [ ] Export download: serves file from Drive with temporary signed URL
- [ ] Storage status: returns real Drive quota from Google API

Drive token refresh: when `expiresAt < now`, auto-refresh using stored
`encryptedRefreshToken` before making Drive API calls. If refresh fails
(user revoked access): return 403 with `DRIVE_AUTH_REQUIRED` error code,
frontend shows "Reconnect Google Drive" prompt.

---

## 16.4 — AI Provider Integration (end-to-end)

### 16.4.1 — Provider resolution flow

Every studio generation job goes through this decision tree:

```
User submits generation request
         │
         ▼
Does user have useManagedKeys=true (paid plan)?
    ├─ YES → Use platform key for this provider
    │        Platform keys stored encrypted in SystemSettings
    │        Decrypted by studio.worker.ts at job time
    │
    └─ NO → Does user have a BYO key for this module+provider?
               ├─ YES → Decrypt user's ApiKey, use it
               │
               └─ NO → Is a free tier available for this module?
                          ├─ YES → Use free tier config
                          │        (e.g. Gemini free quota)
                          └─ NO → Return QUOTA_EXCEEDED or KEY_REQUIRED error
                                  Frontend shows: "Add an API key to continue"
```

### 16.4.2 — BYO Key validation integration

When user saves a new API key in Settings > API Keys:
```typescript
// 1. POST /api/v1/api-keys
//    Body: { module, provider, apiKey }
//    Backend: encrypt and store key
// 2. Immediately run test: POST /api/v1/api-keys/:id/test
//    Backend: decrypt key, make cheapest validation call to provider
//    Return: { status: "ok"|"error", message, latencyMs }
// 3. Frontend:
//    - "ok": show green "Key verified" badge
//    - "error": show red error with the message from provider
//    - User can re-enter key if test fails
```

### 16.4.3 — Generation job lifecycle (frontend ↔ backend)

Studio stages that trigger AI generation follow this pattern:

```typescript
// 1. User clicks "Generate" in a stage workspace
// 2. Frontend: POST /api/v1/studio/generate
//    Body: { projectId, module, provider, model, inputPayload }
// 3. Backend:
//    - Validates user quota (credits, module access)
//    - Creates GenerationJob record with status=QUEUED
//    - Enqueues to BullMQ generation-queue
//    - Returns: { jobId }
// 4. Frontend: begins polling GET /api/v1/studio/jobs/:jobId
//    Poll interval: 2 seconds while QUEUED/PROCESSING
// 5. Job progress updates:
//    - status: QUEUED → show "Waiting in queue..."
//    - status: PROCESSING, progress: 0-100 → show progress bar
//    - status: COMPLETED → fetch output, render result
//    - status: FAILED → show error + retry option
// 6. On completion: invalidate React Query cache for project
```

Polling implementation:
```typescript
// Use React Query's refetchInterval
const { data: job } = useQuery({
  queryKey: ['job', jobId],
  queryFn: () => studioService.getJob(jobId),
  refetchInterval: (data) => {
    if (!data) return 2000
    if (['COMPLETED', 'FAILED', 'CANCELED'].includes(data.status)) return false
    return 2000  // keep polling while active
  },
  enabled: !!jobId,
})
```

### 16.4.4 — Free tier (Gemini) integration

For free-plan users who haven't set a BYO key, the app must offer a viable
path using Gemini free tier. Configure `FREE_TIER_GEMINI_API_KEY` in env
(the platform's Gemini key on free quota):

```typescript
// In studio.worker.ts provider resolution:
if (!managedKeys && !userKey) {
  const freeConfig = await getFreeProviderConfig(module)
  if (freeConfig) {
    // Use platform's free-tier key
    // Apply stricter rate limiting (enforced in job queue)
    provider = getProvider(freeConfig.provider, freeConfig.apiKey)
  } else {
    throw new KeyRequiredError(module)
  }
}
```

Supported free-tier mappings (initial):
- `CHAT` → Gemini Flash (free quota)
- `SCRIPT` → Gemini Flash (free quota)
- `STORYBOARD` → Gemini Flash for text layout
- `IMAGE_GEN` → Gemini Imagen free tier
- `VOICEOVER` → Google TTS free tier

---

## 16.5 — Subscription & Payment Integration (end-to-end)

### 16.5.1 — Checkout flow

```typescript
// User selects plan on /pricing or /subscription/checkout
// 1. POST /api/v1/subscriptions/checkout
//    Body: { planId, billingCycle, promoCode? }
// 2. Backend validates promo code, calculates price
// 3a. If finalPrice === 0:
//     - Backend creates subscription directly
//     - Returns: { success: true, subscription }
//     - Frontend: show success toast, navigate to /subscription?upgraded=true
// 3b. If finalPrice > 0:
//     - Backend creates Stripe checkout session
//     - Returns: { checkoutUrl }
//     - Frontend: window.location.href = checkoutUrl
//     - Stripe hosted page handles payment
//     - Stripe redirects to: APP_URL/subscription/success?session_id=...
//     - Frontend /subscription/success page:
//       * Shows "Processing payment..." spinner
//       * Polls subscription status until ACTIVE
//       * Shows success state + new plan details
```

### 16.5.2 — Stripe webhook integration

```
Stripe → POST /api/v1/webhooks/stripe
```

Critical: test all webhook events using Stripe CLI:
```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

For each event:
- [ ] `checkout.session.completed` → subscription activates, usage resets, confirmation email sent
- [ ] `invoice.paid` → period updates, PaymentRecord created, invoice email sent
- [ ] `invoice.payment_failed` → status → PAST_DUE, grace period set, failure email sent
- [ ] `customer.subscription.updated` → status/period synced
- [ ] `customer.subscription.deleted` → status → CANCELED, cancellation email sent
- [ ] `customer.subscription.trial_will_end` → reminder email sent

Webhook idempotency: check if event was already processed before acting.
Store processed event IDs in Redis with 24h TTL.

### 16.5.3 — Usage enforcement (real-time)

Middleware to check quota before any generation request:
```typescript
// In studio routes before generation endpoint:
const usage = await usageService.getUsageSummary(req.user.id)
if (usage.creditsUsed >= usage.creditsLimit) {
  throw new QuotaExceededError('credits', usage.creditsLimit)
}
// Frontend receives 402 with QUOTA_EXCEEDED code
// Shows upgrade prompt modal
```

Usage warnings at 80%:
```typescript
// After every credit deduction:
const pct = (usage.creditsUsed / usage.creditsLimit) * 100
if (pct >= 80 && pct < 100 && !usage.warned80) {
  await notificationService.create(userId, 'credit_usage_warning', { pct: 80 })
  await usage.update({ warned80: true })
}
```

---

## 16.6 — React Query Integration (replace all mocks)

Every data-fetching hook must use real API calls. Go through each feature:

### Auth queries
```typescript
// useCurrentUser — GET /api/v1/users/me
// staleTime: Infinity (user data doesn't go stale mid-session)
// Invalidate on profile update
```

### Subscription queries
```typescript
// useSubscription — GET /api/v1/subscriptions/me
// staleTime: 60 seconds
// Refetch on window focus (user may have paid in another tab)
```

### Projects queries
```typescript
// useProjects — GET /api/v1/projects
// Infinite query for list (pagination)
// useProject(id) — GET /api/v1/projects/:id
// Mutations: createProject, updateProject, deleteProject
// Each mutation: optimistic update + rollback on error
```

### API Keys queries
```typescript
// useApiKeys — GET /api/v1/api-keys
// Grouped by module
// Mutation: createApiKey (with immediate test)
// Mutation: deleteApiKey
// Mutation: testApiKey
```

### Admin queries
```typescript
// useAdminKPIs — GET /api/v1/admin/dashboard/kpis
// Refetch every 30 seconds in admin dashboard
// useAdminUsers — GET /api/v1/admin/users (paginated + filtered)
// useAdminTickets — GET /api/v1/admin/support/tickets (paginated)
```

### Global query defaults
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 min default
      retry: (count, error) => {
        // Don't retry 4xx errors (they won't change)
        if (error instanceof ApiError && error.status < 500) return false
        return count < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (error) => {
        // Global mutation error → toast
        const msg = error instanceof ApiError
          ? error.message
          : 'Something went wrong'
        useUIStore.getState().addToast({ type: 'error', message: msg })
      },
    },
  },
})
```

---

## 16.7 — Real-time Features Integration

### Notification polling
```typescript
// NotificationPanel queries GET /api/v1/notifications every 30 seconds
// Display unread count badge on bell icon
// Mark read: PATCH /api/v1/notifications/:id/read
// Mark all read: POST /api/v1/notifications/read-all
```

### Announcement display
```typescript
// On app load: GET /api/v1/announcements
// Filter already-dismissed (IDs stored in user profile)
// Show active announcements as dismissible banner in AppLayout
// Dismiss: sends dismissal to profile update, removes from UI
```

### Admin ticket badge
```typescript
// Admin sidebar ticket badge: polls GET /api/v1/admin/support/tickets?status=OPEN
// Every 60 seconds in admin layout
// Shows count of open tickets
```

### Auto-save integration
```typescript
// Studio auto-save — every autoSaveInterval seconds (from user profile, default 30):
const autoSave = useCallback(
  debounce(async (snapshot) => {
    await projectService.autosave(projectId, snapshot)
    setLastSavedAt(new Date())
  }, 1000),
  [projectId]
)

// Trigger on any project state change
useEffect(() => {
  autoSave(studioState)
}, [studioState])
```

---

## 16.8 — Environment & CORS Configuration

### Backend CORS
```typescript
// Only allow frontend origins
app.use(cors({
  origin: [env.APP_URL, 'http://localhost:3000'],
  credentials: true,     // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}))
```

### Cookie configuration
```typescript
// Refresh token cookie
res.cookie('refreshToken', token, {
  httpOnly: true,         // Not accessible from JS
  secure: env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',        // CSRF protection (allows same-site GET)
  maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
  path: '/api/v1/auth',   // Only sent to auth endpoints
})
```

### Frontend environment
```typescript
// /apps/web/.env.local (not committed):
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=...

// /apps/web/.env.production:
VITE_API_URL=https://api.directorbyte.com/api/v1
VITE_APP_URL=https://app.directorbyte.com
```

---

## 16.9 — Integration Test Checklist

Run through each of these manually (and automate in Phase 17):

### Auth
- [ ] Register with email → verify email → sign in → see home
- [ ] Register with email that already exists → see field error
- [ ] Sign in with wrong password (5x) → see lockout message with countdown
- [ ] Forgot password → receive email → reset → sign in with new password
- [ ] Google sign up → new account created → onboarding shown
- [ ] Google sign in → returning user → goes straight to home
- [ ] Access /home without auth → redirect to /signin
- [ ] Access /signin while logged in → redirect to /home
- [ ] Refresh page → session restored via HttpOnly cookie

### Google Drive
- [ ] Connect Drive in settings → authorize → Drive connected
- [ ] Upload project file → file appears in Drive folder
- [ ] Disconnect Drive → storage switches back to local

### Studio & AI
- [ ] Free user: generate with Gemini free tier → job completes → output shown
- [ ] Free user: add BYO OpenAI key → key saved + tested → can generate with it
- [ ] Paid user: no BYO key → uses managed platform key → job completes
- [ ] Exceed credit limit → generation blocked → upgrade prompt shown
- [ ] Job fails → retry button shown → retry creates new job

### Subscriptions
- [ ] View pricing page → all plans load from API (not hardcoded)
- [ ] Apply valid promo code → discount shown in checkout summary
- [ ] Apply expired promo code → error message shown
- [ ] $0 checkout → no Stripe redirect → subscription active immediately
- [ ] Paid checkout → Stripe page → payment → webhook → subscription active
- [ ] Cancel subscription → cancelAtPeriodEnd set → access continues
- [ ] Admin manually assigns plan → user's subscription updates immediately

### Admin
- [ ] Admin login → correct credentials → dashboard loads
- [ ] Admin login with wrong password (5x) → lockout
- [ ] Admin suspend user → user's next request returns 403
- [ ] Admin adjust credits → user's usage meter updates
- [ ] Admin impersonate user → banner shown → actions logged in audit
- [ ] Admin feature flag toggle → feature immediately enabled/disabled in app

---

## 16.10 — Completion Criteria

- [ ] All auth flows work end-to-end with real backend
- [ ] Access tokens auto-refresh silently via HttpOnly cookie
- [ ] Google OAuth completes full cycle: new user → onboarding, existing → home
- [ ] Google Drive connect, sync, and disconnect all work
- [ ] Studio generation resolves correct API key (managed / BYO / free)
- [ ] Generation jobs poll correctly and show real progress
- [ ] Stripe webhooks update subscription state correctly for all event types
- [ ] React Query cache is invalidated correctly after mutations
- [ ] 401 responses trigger silent token refresh, not logout
- [ ] 403 responses show appropriate access denied state
- [ ] CORS configured correctly — no browser CORS errors
- [ ] Notification polling works, unread badge updates
- [ ] Auto-save triggers every N seconds and shows "Saved" indicator
- [ ] All environment variables documented and applied correctly
- [ ] Zero TypeScript errors across frontend and backend
- [ ] Zero console.log left in production code (use logger)
