# Implementation Plan - Phase 16: Integration

Connect the frontend to the real backend API, replacing all mocks with robust end-to-end wiring for authentication, storage, AI generation, and payments.

## Proposed Changes

### 1. API Client Hardening (`/apps/web/src/lib/axios.ts`)
- [ ] Create `ApiError` class in a new file `src/lib/errors.ts`.
- [ ] Refine `axios.ts` to normalize all errors into `ApiError`.
- [ ] Add request/response interceptors as defined in `PHASE_16_INTEGRATION.md`.
- [ ] Ensure `withCredentials: true` is set for all requests.

### 2. Auth Integration
- [ ] Update `auth.service.ts` to match real backend route names (e.g., `/user/profile` -> `/users/me` if necessary).
- [ ] Implement session restoration on app load in `App.tsx`.
- [ ] Implement `/oauth/callback` page for Google OAuth completion.
- [ ] Implement `/verify-email` logic connecting to backend.

### 3. Google Drive Integration
- [ ] Add `drive-connect` and `drive-disconnect` methods to `auth.service.ts`.
- [ ] Update storage settings page to handle the redirect back from Google.
- [ ] Ensure storage status (quota) is fetched from the real API.

### 4. AI & Studio Integration
- [ ] Update `projects.service.ts` to support real generation jobs.
- [ ] Implement job polling logic in Studio components.
- [ ] Wire BYO key validation in Settings.
- [ ] Connect stage workspaces to real backend generation endpoints.

### 5. Subscriptions & Stripe
- [ ] Connect pricing page to fetch real plans.
- [ ] Implement checkout session initiation.
- [ ] Create success/cancel landing pages for Stripe redirect.
- [ ] Test webhooks locally using Stripe CLI (documentation/setup).

### 6. Admin Center Integration
- [ ] Replace mock data in all Admin pages (`Users`, `Subscriptions`, `Tickets`, `Settings`, `AuditLog`) with real API calls.
- [ ] Implement impersonation flow end-to-end.

### 7. Real-time & Optimization
- [ ] Implement notification polling.
- [ ] Wire announcements to profile dismissal state.
- [ ] Implement auto-save with debounce in Studio.

## Verification Plan

### Automated/Manual Tests
- [ ] Complete auth cycle (Sign up -> Verify -> Login -> Logout).
- [ ] Google OAuth login cycle.
- [ ] Google Drive connect/disconnect.
- [ ] Generation job lifecycle (Queue -> Progress -> Complete).
- [ ] Stripe checkout redirect and success handling.
- [ ] Admin actions (Suspend user, Adjust credits) reflected in DB.
