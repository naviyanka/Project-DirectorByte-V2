# DirectorByte API

The backend engine for the DirectorByte AI platform. Built with Express, Prisma, and BullMQ.

## Architecture

- **Controller-Service-Repository Pattern**: Clean separation of concerns.
- **Prisma ORM**: Type-safe database interactions.
- **BullMQ**: Reliable background job processing with Redis.
- **Zod**: Robust request validation.
- **Provider Abstraction**: Interfaces for AI, Storage, and Payments.

## Development

### 1. Install dependencies
```bash
npm install
```

### 2. Database setup
```bash
npx prisma generate
npx prisma migrate dev
```

### 3. Run server
```bash
npm run dev
```

### 4. Run worker
The background worker handles AI generations and other long-running tasks.
```bash
npm run worker:dev
```

## API Documentation
Refer to the [API Reference](../../docs/API_REFERENCE.md) in the root `docs` folder for detailed endpoint documentation.
