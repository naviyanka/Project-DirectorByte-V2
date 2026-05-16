# API Reference (v1)

Base URL: `https://api.directorbyte.com/api/v1`
Content-Type: `application/json`

---

## Authentication

All requests (except registration/login) require a valid JWT in the Authorization header.

`Authorization: Bearer {accessToken}`

### POST /auth/register
Create a new user account.
- **Body**: `{ email, password, displayName }`
- **Response**: `201 Created`

### POST /auth/login
Sign in to an existing account.
- **Body**: `{ email, password }`
- **Response**: `200 OK` (returns user object and accessToken)
- **Cookie**: Sets `refreshToken` as an HttpOnly secure cookie.

### GET /auth/me
Get current user profile.
- **Response**: `200 OK` (User object)

---

## Projects

### GET /projects
List all projects for the authenticated user.
- **Query Params**: `limit`, `offset`, `sort`, `search`.
- **Response**: `200 OK` (Array of projects)

### POST /projects
Create a new project.
- **Body**: `{ title, description, genre, style }`
- **Response**: `201 Created`

### PATCH /projects/:id
Update project metadata.
- **Body**: `{ title, description, ... }`
- **Response**: `200 OK`

---

## Studio & Generation

### POST /studio/generate
Initiate an AI generation job.
- **Body**: `{ projectId, stage, params }`
- **Response**: `202 Accepted` (returns `jobId`)

### GET /studio/jobs/:id
Check status of a generation job.
- **Response**: `200 OK` (Status: PENDING | PROCESSING | COMPLETED | FAILED)

---

## API Keys (BYOK)

### GET /api-keys
List user-provided API keys (hints only).
- **Response**: `200 OK`

### POST /api-keys
Save an API key for a specific provider.
- **Body**: `{ module, provider, key }`
- **Response**: `200 OK`

---

## Subscriptions

### GET /plans
List available subscription plans and their features.
- **Response**: `200 OK`

### POST /subscriptions/checkout
Create a Stripe checkout session for a plan.
- **Body**: `{ planId, billingCycle }`
- **Response**: `200 OK` (Stripe URL)

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 422 | Input failed Zod schema validation. |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication. |
| `FORBIDDEN` | 403 | Insufficient permissions for resource. |
| `NOT_FOUND` | 404 | Resource does not exist. |
| `QUOTA_EXCEEDED` | 403 | User has reached their plan limits. |
| `INTERNAL_ERROR` | 500 | An unexpected server error occurred. |
