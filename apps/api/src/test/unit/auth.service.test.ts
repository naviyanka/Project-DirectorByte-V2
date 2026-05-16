import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import * as tokens from '../../utils/tokens';
import { sendEmail } from '../../services/email.service';

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
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
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/tokens', () => ({
  generateAccessToken: vi.fn().mockReturnValue('access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
  generateEmailToken: vi.fn().mockReturnValue('email-token'),
  generatePasswordResetToken: vi.fn().mockReturnValue('reset-token'),
}));

vi.mock('../../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('creates user with hashed password and assigns free plan', async () => {
      const userData = { email: 'test@example.com', password: 'Password123!', displayName: 'Test User' };
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.plan.findUnique).mockResolvedValue({ id: 'free-plan-id', slug: 'free', limits: { creditsPerMonth: 50 } } as any);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1', ...userData } as any);
      vi.mocked(prisma.subscription.create).mockResolvedValue({ id: 'sub-1', userId: 'user-1' } as any);

      const result = await AuthService.register(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.subscription.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Check your email to verify your account' });
    });

    it('throws ConflictError if email already exists', async () => {
      const userData = { email: 'existing@example.com', password: 'Password123!' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-id' } as any);

      await expect(AuthService.register(userData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'Password123!' };
      const mockUser = { 
        id: 'user-1', 
        email: credentials.email, 
        passwordHash: 'hashed', 
        emailVerified: true, 
        status: 'ACTIVE',
        loginAttempts: 0,
        role: 'USER'
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscription: {
          planId: 'free-plan-id',
          plan: { slug: 'free' }
        }
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      const result = await AuthService.login(credentials, { ip: '127.0.0.1', userAgent: 'test' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('throws AuthError for invalid password', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      const mockUser = { 
        id: 'user-1', 
        email: credentials.email, 
        passwordHash: 'hashed', 
        emailVerified: true, 
        status: 'ACTIVE',
        loginAttempts: 0
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(AuthService.login(credentials, { ip: '127.0.0.1', userAgent: 'test' })).rejects.toThrow('Invalid email or password');
      expect(prisma.user.update).toHaveBeenCalled(); // Increment login attempts
    });
  });
});
