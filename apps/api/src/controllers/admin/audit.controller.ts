import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';

export class AdminAuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, adminId, targetUserId, startDate, endDate, page = 1, perPage = 50 } = req.query;
      const where: any = {};
      if (action) where.action = action;
      if (adminId) where.adminId = adminId;
      if (targetUserId) where.targetUserId = targetUserId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const total = await prisma.auditLog.count({ where });
      const logs = await prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(perPage), take: Number(perPage),
      });
      return response.paginated(res, logs, { page: Number(page), perPage: Number(perPage), total, totalPages: Math.ceil(total / Number(perPage)) });
    } catch (error) { next(error); }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, adminId, targetUserId, startDate, endDate } = req.query;
      const where: any = {};
      if (action) where.action = action;
      if (adminId) where.adminId = adminId;
      if (targetUserId) where.targetUserId = targetUserId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });

      const header = 'id,action,adminId,targetUserId,targetResource,ipAddress,createdAt';
      const rows = logs.map(l => `${l.id},${l.action},${l.adminId || ''},${l.targetUserId || ''},${l.targetResource || ''},${l.ipAddress || ''},${l.createdAt.toISOString()}`);
      const csv = [header, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-log.csv');
      return res.send(csv);
    } catch (error) { next(error); }
  }
}
