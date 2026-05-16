# Deployment Guide

This guide covers the requirements and steps for deploying DirectorByte v2 to a production environment.

---

## 1. Infrastructure Requirements

- **Server**: Node.js 20+ runtime environment (Docker recommended).
- **Database**: PostgreSQL 15+ with SSL support.
- **Cache**: Redis 7+ for job queues and sessions.
- **Storage**: Google Cloud Storage bucket (recommended) or persistent local volume.
- **DNS**: SSL/TLS certificate for `app.*` and `api.*` domains.

---

## 2. Environment Variables (Production)

Ensure these are set in your production environment:

```bash
NODE_ENV=production
APP_URL=https://app.directorbyte.com
API_URL=https://api.directorbyte.com

# Databases
DATABASE_URL=postgresql://.../?sslmode=require
REDIS_URL=redis://...

# Security
JWT_SECRET=             # 64+ character random string
ENCRYPTION_KEY=        # EXACTLY 32 characters
ADMIN_PASSWORD_HASH=    # Bcrypt hash of admin password

# Providers
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GCS_KEY_FILE_PATH=      # Path to service account JSON
```

---

## 3. Deployment Steps

### 1. Build Artifacts
Run the production build in the root directory:
```bash
npm run build
```

### 2. Database Migrations
Always run migrations using the `deploy` command in production to avoid accidental data loss or schema drift:
```bash
npx prisma migrate deploy
```

### 3. Start Processes
DirectorByte requires both the API server and the background workers to be running.

- **API Server**: `npm run start --workspace=api`
- **Workers**: `npm run worker --workspace=api` (if configured as separate process)

Using **PM2** is recommended:
```bash
pm2 start ecosystem.config.js
```

---

## 4. Production Hardening Checklist

- [ ] **Secrets**: Rotate all development keys (`JWT_SECRET`, `ENCRYPTION_KEY`).
- [ ] **SSL**: Ensure `DATABASE_URL` uses `sslmode=require`.
- [ ] **Stripe**: Verify Stripe is in Live Mode.
- [ ] **CORS**: Restrict `CORS_ORIGIN` to your production frontend domain only.
- [ ] **Rate Limiting**: Tune rate limits in `apps/api/src/config/rateLimits.ts`.
- [ ] **Backups**: Schedule daily automated backups for PostgreSQL.
- [ ] **Monitoring**: Integrate Sentry or similar for error tracking.
- [ ] **Logs**: Configure a log aggregator (e.g., CloudWatch, Datadog, or ELK).

---

## 5. Scaling

DirectorByte is horizontally scalable:
- The API is stateless; multiple instances can run behind a load balancer.
- BullMQ workers can be scaled independently of the API.
- Use a connection pooler like **PgBouncer** if scaling to many concurrent backend instances.
