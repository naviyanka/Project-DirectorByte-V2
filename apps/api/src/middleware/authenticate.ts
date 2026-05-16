import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { prisma } from '../config/database';
import { AuthError, ForbiddenError } from '../utils/errors';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new AuthError('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    if (!user) {
      throw new AuthError('User no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscription?.status,
      planFeatures: user.subscription?.plan?.features as any,
    };

    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        subscriptionStatus?: string;
        planFeatures?: Record<string, any>;
      };
    }
  }
}
