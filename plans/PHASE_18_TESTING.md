# PHASE 19 — Automated Testing: Unit, Integration & E2E
> DirectorByte Rebuild · Depends on: PHASE_18 (full app complete)
> Can be run in parallel with Phase 18.

---

## Objective

Build a complete automated test suite covering the backend API, frontend components,
and critical end-to-end user flows. Set up CI/CD pipeline to run tests on every PR.
The goal is confidence to ship — not 100% coverage for its own sake.

---

## 19.1 — Testing Setup

### Backend (`/directorbyte-v2/backend/`)

Install dependencies:
```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
npm install -D @faker-js/faker
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/globalSetup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/migrations/**']
    }
  }
})
```

`/src/test/globalSetup.ts` — runs once before all tests:
```typescript
// Start test PostgreSQL DB (or use TEST_DATABASE_URL from env)
// Run migrations on test DB
// Start test Redis instance (use ioredis-mock for unit tests)
```

`/src/test/setup.ts` — runs before each test file:
```typescript
// Reset DB state using transactions (wrap each test in a transaction, rollback after)
// OR: truncate all tables and re-seed minimal data
// Clear Redis test instance
// Reset mocks
```

### Frontend (`/directorbyte-v2/frontend/`)

Install dependencies:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react
npm install -D @testing-library/user-event @testing-library/jest-dom
npm install -D msw   # Mock Service Worker for API mocking
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  }
})
```

`/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { server } from './mocks/server'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## 19.2 — Test Data Factories

Create `factories/` folder with typed data generators using Faker:

`factories/user.factory.ts`:
```typescript
export function createUserData(overrides = {}) {
  return {
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    password: 'TestPass123!',
    ...overrides,
  }
}

export async function createUser(prisma, overrides = {}) {
  const data = createUserData(overrides)
  return prisma.user.create({
    data: {
      ...data,
      passwordHash: await bcrypt.hash(data.password, 10),
      emailVerified: true,
      status: 'ACTIVE',
      profile: { create: {} },
      subscription: {
        create: {
          planId: freePlanId,
          status: 'ACTIVE',
          usage: { create: { creditsLimit: 50, storageLimitBytes: 2000000000 } }
        }
      }
    }
  })
}
```

Create similar factories for: `plan`, `subscription`, `project`, `supportTicket`, `promoCode`, `apiKey`.

`factories/auth.factory.ts`:
```typescript
// Returns { accessToken, refreshToken } for a given user
export async function authenticateUser(app, email, password): Promise<Tokens>
```

---

## 19.3 — Backend Unit Tests

### Auth Service Tests (`/src/test/unit/auth.service.test.ts`)

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('creates user with hashed password')
    it('auto-assigns free plan to new user')
    it('sends verification email')
    it('throws ConflictError for duplicate email')
    it('rejects weak passwords')
  })

  describe('login', () => {
    it('returns tokens for valid credentials')
    it('increments loginAttempts on wrong password')
    it('locks account after maxAttempts')
    it('rejects unverified email')
    it('rejects suspended user with 403')
  })

  describe('refreshToken', () => {
    it('issues new accessToken for valid refresh token')
    it('rejects expired refresh token')
    it('rejects refresh token not found in DB')
  })

  describe('forgotPassword', () => {
    it('creates reset token and queues email')
    it('returns same response for unknown email (no leak)')
  })

  describe('resetPassword', () => {
    it('updates password hash and invalidates sessions')
    it('rejects expired token')
  })
})
```

### Promo Code Service Tests (`/src/test/unit/promo.service.test.ts`)

```typescript
describe('PromoService', () => {
  describe('validatePromoCode', () => {
    it('returns discount for valid active code')
    it('rejects expired code')
    it('rejects code that hit max redemptions')
    it('rejects if user already used this code')
    it('rejects firstTimeOnly code for returning subscriber')
    it('rejects code not applicable to chosen plan')
    it('calculates correct final price for PERCENT discount')
    it('calculates correct final price for FIXED discount')
    it('never returns negative final price')
    it('returns trialDays for TRIAL_DAYS type')
  })
})
```

### Encryption Service Tests (`/src/test/unit/encryption.service.test.ts`)

```typescript
describe('EncryptionService', () => {
  it('encrypts and decrypts to same value (round-trip)')
  it('produces different ciphertext for same input (random IV)')
  it('throws on decrypt with wrong key')
  it('handles unicode strings correctly')
})
```

### Usage Service Tests (`/src/test/unit/usage.service.test.ts`)

```typescript
describe('UsageService', () => {
  it('decrements credits atomically')
  it('throws QuotaExceededError when at limit')
  it('enqueues warning email at 80% usage')
  it('enqueues warning email at 100% usage')
  it('resets all counters on period rollover')
})
```

---

## 19.4 — Backend Integration Tests (API Routes)

Use Supertest to test routes end-to-end against a real test DB.

### Auth Routes (`/src/test/integration/auth.test.ts`)

```typescript
describe('POST /api/v1/auth/register', () => {
  it('201: creates user and returns message')
  it('409: duplicate email')
  it('422: missing email field')
  it('422: weak password')
  it('429: rate limit after 10 requests')
})

describe('POST /api/v1/auth/login', () => {
  it('200: returns accessToken and refreshToken')
  it('401: wrong password')
  it('401: unverified email')
  it('403: suspended account returns correct error code')
})

describe('POST /api/v1/auth/refresh', () => {
  it('200: returns new accessToken')
  it('401: invalid refresh token')
})
```

### User Routes (`/src/test/integration/users.test.ts`)

```typescript
describe('GET /api/v1/users/me', () => {
  it('200: returns full user profile when authenticated')
  it('401: returns 401 without token')
})

describe('PATCH /api/v1/users/me', () => {
  it('200: updates displayName and returns updated user')
  it('422: rejects displayName over 50 chars')
})

describe('PUT /api/v1/users/me/password', () => {
  it('200: changes password and invalidates other sessions')
  it('401: wrong current password rejected')
})
```

### Subscription Routes (`/src/test/integration/subscriptions.test.ts`)

```typescript
describe('POST /api/v1/subscriptions/checkout', () => {
  it('creates free subscription immediately when promo brings price to $0')
  it('returns Stripe checkout URL for paid plan')
  it('rejects invalid promo code with 422')
  it('rejects inactive plan with 404')
})

describe('POST /api/v1/subscriptions/cancel', () => {
  it('sets cancelAtPeriodEnd=true by default')
  it('cancels immediately when flag set')
})
```

### Admin Routes (`/src/test/integration/admin.test.ts`)

```typescript
describe('Admin Auth', () => {
  it('401 on all /api/v1/admin/* routes without admin token')
  it('POST /api/v1/admin/auth/login: success with correct credentials')
  it('POST /api/v1/admin/auth/login: rate limited after 5 attempts')
})

describe('Admin User Management', () => {
  it('GET /api/v1/admin/users: returns paginated users list')
  it('POST /api/v1/admin/users/:id/suspend: suspends and terminates sessions')
  it('POST /api/v1/admin/users/:id/impersonate: returns impersonation token')
})
```

### API Key Routes (`/src/test/integration/api-keys.test.ts`)

```typescript
describe('POST /api/v1/api-keys', () => {
  it('stores encrypted key, never returns plaintext')
  it('keyHint matches last 4 chars of provided key')
  it('rejects invalid module enum value')
})

describe('POST /api/v1/api-keys/:id/test', () => {
  it('calls provider validateKey and returns status')
  it('404 when key does not belong to user')
})
```

---

## 19.5 — Frontend Component Tests

### Button Component (`/src/test/components/Button.test.tsx`)

```typescript
describe('Button', () => {
  it('renders with correct label')
  it('calls onClick when clicked')
  it('does not call onClick when disabled')
  it('shows spinner when loading=true')
  it('keeps stable width when switching between label and loading state')
  it('applies correct variant classes')
})
```

### Input Component (`/src/test/components/Input.test.tsx`)

```typescript
describe('Input', () => {
  it('renders label when provided')
  it('shows error message when error prop set')
  it('applies error ring class when error prop set')
  it('password input: toggles visibility on eye icon click')
  it('search input: shows clear button when has value')
  it('clear button clears input value')
})
```

### Modal Component (`/src/test/components/Modal.test.tsx`)

```typescript
describe('Modal', () => {
  it('not visible when open=false')
  it('visible when open=true')
  it('calls onClose when backdrop clicked')
  it('calls onClose when Escape pressed')
  it('renders header, body, footer slots correctly')
})
```

### Auth Store (`/src/test/stores/auth.store.test.ts`)

```typescript
describe('authStore', () => {
  it('setUser updates user and isAuthenticated')
  it('logout clears user, token, and isAuthenticated')
  it('initial state: user=null, isAuthenticated=false')
})
```

---

## 19.6 — MSW (Mock Service Worker) Handlers

Create API mock handlers for frontend tests:

`/src/test/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/v1/users/me', () =>
    HttpResponse.json({ success: true, data: mockUser })),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@example.com' && body.password === 'correct') {
      return HttpResponse.json({ success: true, data: { accessToken: 'mock-token', user: mockUser } })
    }
    return HttpResponse.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Wrong password' } }, { status: 401 })
  }),

  http.get('/api/v1/subscriptions/me', () =>
    HttpResponse.json({ success: true, data: mockSubscription })),

  http.get('/api/v1/projects', () =>
    HttpResponse.json({ success: true, data: [mockProject], meta: { total: 1, page: 1, perPage: 20, totalPages: 1 } })),
]
```

---

## 19.7 — E2E Tests with Playwright

Install:
```bash
npm install -D @playwright/test
npx playwright install chromium firefox
```

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ]
})
```

### Critical User Flows to Test

**`e2e/auth.spec.ts` — Authentication Flow:**
```typescript
test('User can register, verify email, and log in', async ({ page }) => {
  // 1. Navigate to /signup
  // 2. Fill in name, email, password
  // 3. Submit form
  // 4. See "check your email" message
  // 5. [Simulate email verification by calling API directly in test]
  // 6. Navigate to /login
  // 7. Fill credentials, submit
  // 8. Redirected to /home
  // 9. User name visible in sidebar
})

test('Forgot password flow works end-to-end', async ({ page }) => {
  // 1. Go to /login → click "Forgot password"
  // 2. Enter email, submit
  // 3. [Get reset token from test DB]
  // 4. Navigate to /reset-password?token=...
  // 5. Enter new password
  // 6. Log in with new password
})
```

**`e2e/project.spec.ts` — Project Creation:**
```typescript
test('User can create a project and see it on home dashboard', async ({ page }) => {
  // 1. Log in (use stored auth state)
  // 2. Click "New Project" button
  // 3. Enter project name, select genre
  // 4. Submit
  // 5. Redirected to /studio/:projectId
  // 6. Navigate back to /home
  // 7. Project card visible with correct title
})
```

**`e2e/subscription.spec.ts` — Free Subscription Flow:**
```typescript
test('User can apply a 100% promo code and get paid plan without payment', async ({ page }) => {
  // 1. Log in
  // 2. Navigate to /pricing
  // 3. Click "Get Creator" plan
  // 4. Enter promo code for 100% off
  // 5. See "Free — no payment required" confirmation
  // 6. Submit
  // 7. Plan shows as "Creator" in sidebar badge
})
```

**`e2e/admin.spec.ts` — Admin Login:**
```typescript
test('Admin can log in and see dashboard KPIs', async ({ page }) => {
  // 1. Navigate to /admin/login
  // 2. Enter admin credentials
  // 3. Submit
  // 4. See admin dashboard with user count
  // 5. Navigate to users list
  // 6. See test user in the list
})
```

**`e2e/support.spec.ts` — Support Ticket:**
```typescript
test('User can create and close a support ticket', async ({ page }) => {
  // 1. Log in
  // 2. Navigate to /support
  // 3. Click "Open a ticket"
  // 4. Fill in subject, category, body
  // 5. Submit
  // 6. See ticket in list with OPEN status
  // 7. Open ticket, click "Close ticket"
  // 8. Status changes to CLOSED
})
```

### Playwright Auth Setup (Reuse Logged-In State)

```typescript
// e2e/auth.setup.ts
// Logs in once, saves browser storage state to a file
// All other tests load from this state — no repeated logins

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', process.env.TEST_USER_EMAIL)
  await page.fill('[name=password]', process.env.TEST_USER_PASSWORD)
  await page.click('[type=submit]')
  await page.waitForURL('/home')
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
```

---

## 19.8 — CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: directorbyte_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s
      redis:
        image: redis:7
        ports: ['6379:6379']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci
      - run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/directorbyte_test
      - run: cd backend && npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/directorbyte_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-32-chars-minimum-len
          ENCRYPTION_KEY: test-encryption-key-32chars-long!
          ADMIN_USERNAME: testadmin
          ADMIN_PASSWORD_HASH: $2b$10$... # pre-hashed "testpassword"
      - uses: codecov/codecov-action@v4
        with: { files: ./backend/coverage/lcov.info, flags: backend }

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v4
        with: { files: ./frontend/coverage/lcov.info, flags: frontend }

  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main'  # only run E2E on main
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run start:test &  # start app
      - run: npx playwright test
        env:
          E2E_BASE_URL: http://localhost:5173
          TEST_USER_EMAIL: e2e@test.com
          TEST_USER_PASSWORD: E2eTestPass1!
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 19.9 — Coverage Targets

These are targets, not hard requirements. Focus on critical paths.

| Area | Target Coverage |
|------|----------------|
| Auth service | 90% |
| Promo/discount logic | 95% |
| Encryption service | 100% |
| Usage tracking | 90% |
| API routes (integration) | 70% |
| Frontend components | 60% |
| E2E critical flows | 5 flows covered |

---

## 19.10 — Completion Criteria

- [ ] `npm test` in `/backend` runs all tests and passes
- [ ] `npm test` in `/frontend` runs all tests and passes
- [ ] Auth service unit tests: all scenarios pass
- [ ] Promo code unit tests: all edge cases pass
- [ ] Encryption service unit tests: round-trip verified
- [ ] API route integration tests: register, login, refresh, CRUD pass
- [ ] Admin route tests: correct 401 without token
- [ ] MSW handlers set up for all frontend test API calls
- [ ] Button, Input, Modal component tests pass
- [ ] Playwright E2E: 5 critical flows pass in Chromium
- [ ] GitHub Actions CI workflow runs on PR and passes
- [ ] Coverage reports uploaded to Codecov (or equivalent)
- [ ] No test pollutes another (proper DB reset between tests)
- [ ] Zero TypeScript errors in test files
