/**
 * Audit Logger Middleware
 * ------------------------
 * Wraps admin actions and logs them to the AuditLog table.
 * Usage: auditLogger('USER_UPDATED') as middleware on a route.
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditAction } from '@prisma/client';

export function auditLogger(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method to capture response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Log after the response is sent successfully
      if (res.statusCode < 400 && req.adminSession) {
        prisma.auditLog.create({
          data: {
            action: action as AuditAction,
            adminId: req.adminSession.sessionId,
            targetUserId: req.params.id || req.params.userId || undefined,
            targetResource: req.baseUrl.split('/').pop() || undefined,
            targetResourceId: req.params.id || undefined,
            details: {
              method: req.method,
              path: req.originalUrl,
              body: sanitizeBody(req.body),
            },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'] || undefined,
          },
        }).catch(() => {
          // Silently fail — audit logging should never break the request
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/** Remove sensitive fields from request body before logging */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'newPassword', 'currentPassword', 'apiKey', 'secretKey'];
  for (const key of sensitiveKeys) {
    if (sanitized[key]) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}
