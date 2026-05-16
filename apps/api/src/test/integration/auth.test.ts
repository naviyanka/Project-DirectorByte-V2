import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../config/database';
import { sendEmail } from '../../services/email.service';

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
    },
    subscriptionUsage: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  }
}));

vi.mock('../../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Auth Integration', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('returns 201 when registration is successful', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any);
      vi.mocked(prisma.plan.findUnique).mockResolvedValue({ id: 'free-plan-id', slug: 'free', limits: { storageGb: 2 } } as any);
      vi.mocked(prisma.subscription.create).mockResolvedValue({ id: 'sub-1' } as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          displayName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.message).toContain('Check your email');
    });

    it('returns 409 when email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-id' } as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          displayName: 'Existing User'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already registered');
    });
  });
});
