# DirectorByte v2 — Directory Scaffold Preview

This is the planned structure for the `directorbyte-v2` directory.

```text
/directorbyte-v2/
├── backend/                # Express API Server (TypeScript)
│   ├── src/
│   │   ├── config/         # App configuration & Env validation
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, Error, Validation, Logging
│   │   ├── models/         # Prisma client / Domain models
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Core Logic (AI, Storage, Payments)
│   │   │   ├── ai/         # Multi-provider AI orchestrators
│   │   │   ├── storage/    # GCS, Drive, Local adapters
│   │   │   ├── payments/   # Stripe abstraction
│   │   │   └── email/      # Nodemailer + Templates
│   │   ├── workers/        # BullMQ worker definitions
│   │   ├── utils/          # Helpers & Logger (Pino)
│   │   └── index.ts        # Entry point
│   ├── prisma/             # Schema & Migrations
│   ├── tests/              # Unit & Integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React Vite App (TypeScript)
│   ├── src/
│   │   ├── assets/         # Styles, Images, Fonts
│   │   ├── components/     # UI Design System
│   │   │   ├── ui/         # Radix + Tailwind primitives
│   │   │   ├── layout/     # Sidebar, Header, Page Wrappers
│   │   │   └── features/   # Feature-specific components (Studio, Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API client (Axios/Fetch + React Query)
│   │   ├── store/          # Zustand state management
│   │   ├── types/          # Frontend-specific types
│   │   ├── utils/          # Formatting, validation helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/             # Static assets
│   ├── tailwind.config.ts  # Tailwind v4 configuration
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # Shared TypeScript types & Constants
│   ├── types/              # DTOs, API Interfaces, DB Schemas
│   ├── constants/          # Error codes, Enums, Limits
│   └── index.ts
│
├── docs/                   # System documentation
├── scripts/                # Devops & Database scripts
├── docker-compose.yml      # Local dev environment (DB, Redis)
└── ANALYSIS_REPORT.md      # Phase 00 Source of Truth
```

### Component Breakdown

- **`backend/services/ai/`**: This will implement an interface-based system to allow switching between Google Vertex, OpenAI, Runway, etc.
- **`backend/workers/`**: All long-running AI generations will be moved here using BullMQ to ensure reliability and retries.
- **`shared/`**: Crucial for keeping frontend and backend types in sync (e.g. `Project` interface).
- **`frontend/components/ui/`**: A custom-styled UI kit following the "Premium Cinema" aesthetic.
