# DirectorByte v2

AI-powered film generation platform. Turn any idea into a complete film with AI-generated scripts, storyboards, keyframes, video, and audio — all in one modular pipeline.

DirectorByte v2 is a complete rewrite of the original platform, focusing on performance, modularity, and a premium user experience. It supports a multi-provider AI strategy, enabling the use of state-of-the-art models for every stage of production.

---

## Features

- **End-to-End Pipeline**: From concept to script, storyboard, keyframes, video, and audio.
- **Multi-Provider AI**: Support for Gemini, OpenAI, Anthropic, RunwayML, Kling, Pika, ElevenLabs, and more.
- **Bring Your Own Key (BYOK)**: Users can use their own AI provider keys on the free tier.
- **Cloud Storage**: Deep integration with Google Drive and local storage options.
- **Production Studio**: A professional workspace for directing and refining AI generations.
- **Shared Project Viewer**: Publicly share your cinematic creations with a single link.
- **Admin Center**: Comprehensive platform management for users, subscriptions, and system settings.
- **Subscription Engine**: Integrated with Stripe for tiered access and usage limits.
- **Support System**: Built-in ticketing and help center.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React, Vite, Framer Motion, Zustand, React Query |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (via Prisma ORM) |
| **Job Queue** | BullMQ + Redis |
| **Styling** | Vanilla CSS (CSS Modules) + Design System |
| **Auth** | JWT (Memory) + Refresh Tokens (HttpOnly Cookie) |

## Prerequisites

- **Node.js**: 20+
- **Docker & Docker Compose**: For local PostgreSQL and Redis
- **Google Cloud Account**: For Google Drive integration (optional for local dev)
- **Stripe Account**: For testing subscriptions (optional for local dev)

## Local Development

### 1. Clone and Install
```bash
git clone https://github.com/directorbyte/directorbyte-v2.git
cd directorbyte-v2
npm install
```

### 2. Environment Setup
Copy the example environment file and fill in the required values.
```bash
cp .env.example .env
```
Minimum required variables for basic functionality:
- `DATABASE_URL`: Connection string for PostgreSQL
- `REDIS_URL`: Connection string for Redis
- `JWT_SECRET`: Random string for signing tokens
- `ENCRYPTION_KEY`: 32-character string for API key encryption

### 3. Start Infrastructure
Run the database and Redis using Docker:
```bash
make db-up
```

### 4. Run Migrations & Seed
Setup the database schema and initial data (including the free plan):
```bash
make db-migrate
make db-seed
```

### 5. Generate Admin Password
Create a bcrypt hash for your initial admin password:
```bash
make admin-hash password=yourpassword
```
Copy the resulting hash into `ADMIN_PASSWORD_HASH` in your `.env`.

### 6. Start Development Servers
```bash
make dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Admin Center**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Project Structure

```text
directorbyte-v2/
├── apps/
│   ├── api/            # Express backend
│   └── web/            # Vite/React frontend
├── packages/
│   ├── ui/             # Shared design system components (planned)
│   └── types/          # Shared TypeScript definitions
├── docs/               # Detailed documentation
├── prisma/             # Database schema and migrations
└── docker-compose.yml  # Local infrastructure
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and data flows
- [Module Guide](./docs/MODULES.md) - Deep dive into feature implementation
- [Admin Guide](./docs/ADMIN_GUIDE.md) - Manual for platform administrators
- [API Reference](./docs/API_REFERENCE.md) - Endpoint documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production setup and hardening

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Key for JWT signing |
| `ENCRYPTION_KEY` | Yes | 32-char key for AES-256 encryption |
| `STORAGE_PROVIDER` | No | `local`, `gcs`, or `drive` |
| `PAYMENT_GATEWAY` | No | `stripe`, `paddle`, or `razorpay` |

*See [.env.example](.env.example) for a complete list of all configurable variables.*

## Contributing

1. Ensure all code passes TypeScript strict mode checks.
2. Follow the feature-based directory structure in `apps/web`.
3. Document any new API endpoints in `docs/API_REFERENCE.md`.
4. Run `npm run lint` before submitting PRs.

## License

Copyright © 2026 DirectorByte. All rights reserved.
