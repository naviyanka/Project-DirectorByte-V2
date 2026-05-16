import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { generateAccessToken } from '../../utils/tokens';
import { sendEmail } from '../../services/email.service';

export class AdminUserController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, plan, sortBy = 'createdAt', sortOrder = 'desc', page = 1, perPage = 20 } = req.query;
      const where: any = { deletedAt: null };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { displayName: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      if (plan) where.subscription = { plan: { slug: plan } };

      const total = await prisma.user.count({ where });
      const users = await prisma.user.findMany({
        where, orderBy: { [sortBy as string]: sortOrder },
        skip: (Number(page) - 1) * Number(perPage), take: Number(perPage),
        include: { subscription: { include: { plan: true } } },
      });

      return response.paginated(res, users.map(u => ({
        id: u.id, email: u.email, displayName: u.displayName, status: u.status, role: u.role,
        createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
        plan: u.subscription?.plan?.name || 'None',
        subscriptionStatus: u.subscription?.status || 'None',
      })), { page: Number(page), perPage: Number(perPage), total, totalPages: Math.ceil(total / Number(perPage)) });
    } catch (error) { next(error); }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          profile: true, sessions: true, apiKeys: true,
          subscription: { include: { plan: true, usage: true } },
          projects: { where: { deletedAt: null }, take: 50 },
          supportTickets: { take: 20, orderBy: { createdAt: 'desc' } },
          storageConnection: true,
        },
      });
      if (!user) throw new NotFoundError('User');

      const auditLogs = await prisma.auditLog.findMany({
        where: { targetUserId: user.id }, orderBy: { createdAt: 'desc' }, take: 50,
      });

      return response.ok(res, {
        ...user,
        passwordHash: undefined, // Strip sensitive
        apiKeys: user.apiKeys.map(k => ({ ...k, encryptedKey: undefined })),
        auditLogs,
      });
    } catch (error) { next(error); }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { displayName, bio, status, emailVerified } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { displayName, bio, status, emailVerified },
      });
      return response.ok(res, { id: updated.id, status: updated.status });
    } catch (error) { next(error); }
  }

  static async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
        await tx.session.deleteMany({ where: { userId: req.params.id } });
      });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: req.params.id }, data: { status: 'BANNED' } });
        await tx.session.deleteMany({ where: { userId: req.params.id } });
      });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async enableUser(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { method, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) throw new NotFoundError('User');

      if (method === 'set' && newPassword) {
        const hash = await bcrypt.hash(newPassword, 12);
        await prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
          await tx.session.deleteMany({ where: { userId: user.id } });
        });
      }
      // method === 'email' would trigger forgot-password flow
      return response.ok(res, { success: true, method });
    } catch (error) { next(error); }
  }

  static async impersonate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) throw new NotFoundError('User');

      const token = generateAccessToken(user.id, user.role);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await prisma.session.create({
        data: { userId: user.id, token, refreshToken: crypto.randomBytes(32).toString('hex'), expiresAt, ipAddress: req.ip, userAgent: 'Admin Impersonation' },
      });

      return response.ok(res, { impersonationToken: token });
    } catch (error) { next(error); }
  }

  static async endImpersonation(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.session.deleteMany({ where: { userId: req.params.id, userAgent: 'Admin Impersonation' } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async sendEmailToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) throw new NotFoundError('User');
      const { subject, body } = req.body;
      await sendEmail(user.email, subject, 'generic', { body });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.session.delete({ where: { id: req.params.sessionId } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async deleteAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await prisma.session.deleteMany({ where: { userId: req.params.id } });
      return response.ok(res, { success: true, terminated: result.count });
    } catch (error) { next(error); }
  }
}
