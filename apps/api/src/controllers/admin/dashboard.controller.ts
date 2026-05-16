import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';

export class AdminDashboardController {
  static async getKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const h24 = new Date(now.getTime() - 86400000);
      const d7 = new Date(now.getTime() - 7 * 86400000);
      const d30 = new Date(now.getTime() - 30 * 86400000);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalUsers, active24h, active7d, active30d, newToday, newMonth, pending] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { lastActiveAt: { gte: h24 } } }),
          prisma.user.count({ where: { lastActiveAt: { gte: d7 } } }),
          prisma.user.count({ where: { lastActiveAt: { gte: d30 } } }),
          prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
          prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
          prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } }),
        ]);

      const [activeSubs, trialingSubs, pastDueSubs, canceledSubs] = await Promise.all([
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'TRIALING' } }),
        prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
        prisma.subscription.count({ where: { status: 'CANCELED' } }),
      ]);

      const [openTickets, urgentTickets] = await Promise.all([
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.supportTicket.count({ where: { priority: 'URGENT', status: { not: 'CLOSED' } } }),
      ]);

      const jobsToday = await prisma.generationJob.count({ where: { queuedAt: { gte: startOfDay } } });
      const jobsMonth = await prisma.generationJob.count({ where: { queuedAt: { gte: startOfMonth } } });

      let dbStatus = 'ok';
      try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'degraded'; }

      return response.ok(res, {
        users: { total: totalUsers, active24h, active7d, active30d, newToday, newThisMonth: newMonth, pendingVerification: pending },
        subscriptions: { active: activeSubs, trialing: trialingSubs, pastDue: pastDueSubs, canceled: canceledSubs, mrrCents: 0, arrCents: 0, churnRatePercent: 0, byPlan: [] },
        usage: { totalCreditsUsedThisMonth: 0, totalStorageUsedBytes: '0', generationJobsToday: jobsToday, generationJobsThisMonth: jobsMonth },
        support: { openTickets, urgentTickets, avgResponseHours: 0 },
        system: { dbStatus, redisStatus: 'ok', storageStatus: 'ok', queueDepth: 0 },
      });
    } catch (error) { next(error); }
  }

  static async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const { metric = 'user_growth', period = '30d' } = req.query;
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
      const labels: string[] = [];
      const data: number[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        labels.push(d.toISOString().split('T')[0]);
        data.push(0); // Placeholder — real queries would populate
      }

      return response.ok(res, { labels, data, metric, period });
    } catch (error) { next(error); }
  }

  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' }, take: 30,
      });
      return response.ok(res, logs);
    } catch (error) { next(error); }
  }
}
