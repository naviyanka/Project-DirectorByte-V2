import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { AuthError, NotFoundError } from '../utils/errors';
import bcrypt from 'bcrypt';
import { generateEmailToken } from '../utils/tokens';
import { sendEmail } from '../services/email.service';
import { getEnv } from '../config/env';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          profile: true,
          subscription: {
            include: {
              plan: true,
              usage: true
            }
          },
          storageConnection: true
        }
      });

      if (!user) throw new NotFoundError('User');

      const currentUsage = user.subscription?.usage;
      const storageConnected = !!user.storageConnection;

      return response.ok(res, {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        profile: user.profile,
        subscription: user.subscription ? {
          planName: user.subscription.plan.name,
          planSlug: user.subscription.plan.slug,
          status: user.subscription.status,
          billingCycle: user.subscription.billingCycle,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          usage: currentUsage ? {
            creditsUsed: currentUsage.creditsUsed,
            creditsLimit: currentUsage.creditsLimit,
            storageUsedBytes: currentUsage.storageUsedBytes.toString(),
            storageLimitBytes: currentUsage.storageLimitBytes.toString(),
            exportsCount: currentUsage.exportsCount,
            exportsLimit: currentUsage.exportsLimit
          } : null
        } : null,
        storageConnected,
        storageProvider: user.storageProvider
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { displayName, bio, onboardingComplete } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(displayName && { displayName }),
          ...(bio !== undefined && { bio }),
          ...(onboardingComplete !== undefined && { onboardingComplete }),
        }
      });
      return response.ok(res, { 
        displayName: user.displayName, 
        bio: user.bio, 
        onboardingComplete: user.onboardingComplete 
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await prisma.profile.update({
        where: { userId: req.user!.id },
        data: req.body // Validated by zod in routes
      });
      return response.ok(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { newEmail, password } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash || ''))) {
        throw new AuthError('Invalid password');
      }

      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing) {
        return response.badRequest(res, 'EMAIL_TAKEN', 'Email is already in use');
      }

      const token = generateEmailToken();
      // We don't change the email yet, we store it somewhere or just send the link with the new email encoded.
      // For simplicity, we can store it in a new column or metadata, but for now we'll just return success.
      // A full implementation would require a `pendingEmail` column in the User table.
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: token,
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      const link = `${getEnv().APP_URL}/auth/verify-new-email?token=${token}&email=${newEmail}`;
      await sendEmail(newEmail, 'Verify your new email', 'verify-email', { verificationLink: link });

      return response.ok(res, { message: 'Verify your new email to confirm the change' });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash || ''))) {
        throw new AuthError('Invalid current password');
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Invalidate other sessions
      const authHeader = req.headers.authorization;
      const currentToken = authHeader?.split(' ')[1];
      
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: currentToken }
        }
      });

      // Send email (we don't have the password-changed template created yet, but the service handles it gracefully)
      await sendEmail(user.email, 'Your password was changed', 'password-changed', {});

      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return response.badRequest(res, 'NO_FILE', 'No image file provided');
      }

      const uploadDir = path.resolve(getEnv().LOCAL_UPLOAD_PATH, 'avatars');
      await fs.mkdir(uploadDir, { recursive: true });

      const filename = `user_${req.user!.id}_avatar.webp`;
      const outputPath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // In a real app with GCS/Drive, we'd upload this buffer to the cloud provider.
      const avatarUrl = `${getEnv().API_URL}/uploads/avatars/${filename}`;

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarUrl }
      });

      return response.ok(res, { avatarUrl });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarUrl: null }
      });
      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, confirmation } = req.body;

      if (confirmation !== 'DELETE') {
        return response.badRequest(res, 'INVALID_CONFIRMATION', 'Must confirm with DELETE');
      }

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash || ''))) {
        throw new AuthError('Invalid password');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'DELETED',
          deletedAt: new Date()
        }
      });

      await prisma.session.deleteMany({ where: { userId: user.id } });

      return response.ok(res, { message: 'Account scheduled for deletion' });
    } catch (error) {
      next(error);
    }
  }

  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: req.user!.id },
        orderBy: { lastUsedAt: 'desc' }
      });

      const currentToken = req.headers.authorization?.split(' ')[1];

      const mapped = sessions.map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
        isCurrent: s.token === currentToken
      }));

      return response.ok(res, mapped);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentToken = req.headers.authorization?.split(' ')[1];

      const session = await prisma.session.findUnique({ where: { id } });
      if (!session || session.userId !== req.user!.id) {
        throw new NotFoundError('Session');
      }

      if (session.token === currentToken) {
        return response.badRequest(res, 'CANNOT_DELETE_CURRENT', 'Cannot terminate current session via this route. Use /logout.');
      }

      await prisma.session.delete({ where: { id } });
      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const archiver = (await import('archiver')).default;
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
      if (!user) throw new NotFoundError('User');
      
      const projects = await prisma.project.findMany({ where: { userId } });
      const versions = await prisma.projectVersion.findMany({ where: { projectId: { in: projects.map(p => p.id) } } });
      const subscription = await prisma.subscription.findUnique({ where: { userId }, include: { usage: true } });
      const apiKeys = await prisma.apiKey.findMany({ where: { userId }, select: { id: true, provider: true, keyHint: true, createdAt: true } });
      const tickets = await prisma.supportTicket.findMany({ where: { userId }, include: { messages: true } });

      const manifest = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email, displayName: user.displayName, profile: user.profile },
        subscription,
        apiKeys,
        tickets,
        projects: projects.map(p => ({
          ...p,
          versions: versions.filter(v => v.projectId === p.id)
        }))
      };

      const archive = archiver('zip', { zlib: { level: 9 } });
      res.attachment(`directorbyte-export-${new Date().toISOString().split('T')[0]}.zip`);
      archive.pipe(res);

      archive.append(JSON.stringify(manifest, null, 2), { name: 'export.json' });
      for (const p of projects) {
        archive.append(JSON.stringify(p, null, 2), { name: `projects/${p.id}/metadata.json` });
      }

      await archive.finalize();
      console.warn(`User ${userId} exported data`);
    } catch (error) { next(error); }
  }
}
