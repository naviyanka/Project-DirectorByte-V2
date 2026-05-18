import { vi, beforeAll, afterAll, beforeEach } from 'vitest';
import Redis from 'ioredis-mock';

// Mock Redis
vi.mock('ioredis', () => {
  return {
    default: Redis,
    Redis: Redis
  };
});

// Mock environment variables if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-very-long-and-secure-123';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

beforeAll(async () => {
  // Initialization if needed
});

afterAll(async () => {
  // Cleanup if needed
});

beforeEach(async () => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Clear Redis
  const redis = new Redis();
  await redis.flushall();
});

process.env.ADMIN_SESSION_SECRET = '12345678901234567890123456789012';
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/directorbyte_test';
