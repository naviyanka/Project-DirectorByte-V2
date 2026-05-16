# Module Guide

This document provides a detailed breakdown of the feature modules in DirectorByte v2, serving as a guide for developers to understand and modify specific parts of the system.

---

## 1. Authentication Module

**Purpose:** Handles all user identity, session management, and onboarding.
**Entry Points:** `/signin`, `/signup`, `/forgot-password`, `/onboarding`, `/oauth/callback`.
**Backend Routes:** `/api/v1/auth/*`.
**Database Models:** `User`, `Session`, `StorageConnection`.
**External Services:** Google OAuth API.
**State:** `auth.store` (Zustand).

**Developer Notes:**
- To add a new OAuth provider: Implement the provider logic in `auth.service.ts` and add the corresponding route in `auth.routes.ts`.
- Session security is handled via HttpOnly cookies for refresh tokens.

---

## 2. Project Module

**Purpose:** Manages user film projects, including creation, listing, and metadata.
**Entry Points:** `/home` (Dashboard), `/projects` (Management).
**Backend Routes:** `/api/v1/projects/*`.
**Database Models:** `Project`, `ProjectVersion`.
**State:** React Query (`projects`, `project/:id`).

**Developer Notes:**
- Project versions are created automatically when significant changes occur in the Studio.
- The project grid supports both list and grid views with responsive layouts.

---

## 3. Studio Module

**Purpose:** The core film production pipeline workspace.
**Entry Points:** `/studio/:projectId`.
**Backend Routes:** `/api/v1/studio/*`.
**Database Models:** `GenerationJob`, `Project`.
**External Services:** AI Providers (Gemini, RunwayML, etc.).
**State:** `studio.store` (Zustand), React Query (Jobs).

**Developer Notes:**
- The pipeline is divided into stages (Script, Storyboard, etc.). Each stage is a separate feature directory in `apps/web/src/features/studio/stages`.
- New AI models are added via the `AIProvider` interface on the backend.

---

## 4. API Key Manager

**Purpose:** Allows users to manage their own AI provider keys (BYOK).
**Entry Points:** `/settings/api-keys`.
**Backend Routes:** `/api/v1/api-keys/*`.
**Database Models:** `ApiKey`.
**Security:** Keys are encrypted using AES-256-GCM before storage.

**Developer Notes:**
- The raw key never leaves the backend. Only the last 4 characters are shown as a "hint".
- Key validation happens via the `testConnection` endpoint in the `apiKeysService`.

---

## 5. Subscription & Billing

**Purpose:** Plan management, Stripe checkout, and usage tracking.
**Entry Points:** `/pricing`, `/subscription`.
**Backend Routes:** `/api/v1/subscriptions/*`, `/api/v1/plans`.
**Database Models:** `Subscription`, `SubscriptionUsage`, `Plan`.
**External Services:** Stripe.

**Developer Notes:**
- Plan limits (credits, storage) are defined in the `Plan` model and enforced by the `usageMiddleware`.
- Webhooks from Stripe are processed in `stripe.webhook.ts` to sync subscription status.

---

## 6. Admin Center

**Purpose:** Internal management platform for administrators.
**Entry Points:** `/admin/*`.
**Backend Routes:** `/api/v1/admin/*`.
**Database Models:** `AdminSession`, `AuditLog`.
**State:** `admin.store` (Zustand).

**Developer Notes:**
- All admin routes are protected by `adminAuth` middleware.
- Destructive actions must be logged using the `AuditLogger`.

---

## 7. Support & Help Center

**Purpose:** User assistance via tickets and help articles.
**Entry Points:** `/support`, `/admin/tickets`.
**Backend Routes:** `/api/v1/support/*`, `/api/v1/help/*`.
**Database Models:** `SupportTicket`, `HelpArticle`.

**Developer Notes:**
- Help articles support Markdown and are managed via the Admin Center.
- Tickets support priorities (Urgent, High, Normal) and internal admin notes.

---

## 8. Notification System

**Purpose:** In-app alerts for system events and job completions.
**Entry Points:** Topbar notification panel.
**Backend Routes:** `/api/v1/notifications/*`.
**Database Models:** `Notification`.

**Developer Notes:**
- Notifications are polled every 30 seconds by default.
- Types include `JOB_COMPLETED`, `SUBSCRIPTION_EXPIRED`, and `SYSTEM_ANNOUNCEMENT`.

---

## 9. Storage & Assets

**Purpose:** Unified interface for file management across different providers.
**Entry Points:** `/settings/storage`.
**Backend Routes:** `/api/v1/storage/*`.
**Database Models:** `StorageConnection`.

**Developer Notes:**
- All file operations go through the `StorageAdapter` interface.
- Local storage is the default; Google Drive can be connected per-user.
