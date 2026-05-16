/**
 * Admin Authentication Middleware
 * --------------------------------
 * Validates admin session tokens from the AdminSession table.
 * Completely separate from user JWT authentication.
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthError } from '../utils/errors';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid admin authorization');
    }

    const token = authHeader.split(' ')[1];

    const session = await prisma.adminSession.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.adminSession.delete({ where: { id: session.id } });
      throw new AuthError('Invalid or expired admin session');
    }

    req.adminSession = {
      sessionId: session.id,
      token: session.token,
      ipAddress: session.ipAddress || undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      adminSession?: {
        sessionId: string;
        token: string;
        ipAddress?: string;
      };
    }
  }
}
