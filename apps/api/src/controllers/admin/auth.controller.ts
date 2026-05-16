import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { response } from '../../utils/response';
import { AuthError } from '../../utils/errors';

const SESSION_EXPIRY_HOURS = 4;

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (username !== env.ADMIN_USERNAME) {
        throw new AuthError('Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
      if (!isValid) {
        throw new AuthError('Invalid credentials');
      }

      const token = crypto.randomBytes(48).toString('hex');
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 3600000);

      const session = await prisma.adminSession.create({
        data: {
          token,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
          expiresAt,
        },
      });

      return response.ok(res, { token: session.token, expiresAt: session.expiresAt });
    } catch (error) { next(error); }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.adminSession) {
        await prisma.adminSession.delete({ where: { id: req.adminSession.sessionId } });
      }
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await prisma.adminSession.findUnique({
        where: { id: req.adminSession!.sessionId },
      });
      if (!session) throw new AuthError('Session not found');

      return response.ok(res, {
        username: env.ADMIN_USERNAME,
        sessionId: session.id,
      });
    } catch (error) { next(error); }
  }

  static async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      // Scaffold for Phase 08 implementation
      return response.serverError(res, 'Not Implemented: 2FA setup will be available in Phase 08.');
    } catch (error) { next(error); }
  }

  static async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      // Scaffold for Phase 08 implementation
      return response.serverError(res, 'Not Implemented: 2FA verification will be available in Phase 08.');
    } catch (error) { next(error); }
  }
}
