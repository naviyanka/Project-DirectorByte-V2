import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError, AppError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

export class AdminSubscriptionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, plan, page = 1, perPage = 20 } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (plan) where.plan = { slug: plan };

      const total = await prisma.subscription.count({ where });
      const subs = await prisma.subscription.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(perPage), take: Number(perPage),
        include: { user: { select: { id: true, email: true, displayName: true } }, plan: true },
      });
      return response.paginated(res, subs, { page: Number(page), perPage: Number(perPage), total, totalPages: Math.ceil(total / Number(perPage)) });
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { id: req.params.id }, include: { usage: true } });
      if (!sub) throw new NotFoundError('Subscription');

      const { planId, status, billingCycle, currentPeriodEnd, cancelAtPeriodEnd } = req.body;
      const data: any = {};
      if (status) data.status = status;
      if (billingCycle) data.billingCycle = billingCycle;
      if (currentPeriodEnd) data.currentPeriodEnd = new Date(currentPeriodEnd);
      if (cancelAtPeriodEnd !== undefined) data.cancelAtPeriodEnd = cancelAtPeriodEnd;

      if (planId && planId !== sub.planId) {
        data.planId = planId;
        const newPlan = await prisma.plan.findUnique({ where: { id: planId } });
        if (newPlan && sub.usage) {
          const limits = newPlan.limits as any;
          await prisma.subscriptionUsage.update({
            where: { id: sub.usage.id },
            data: {
              creditsLimit: limits?.creditsPerMonth || 50,
              storageLimitBytes: BigInt((limits?.storageGb || 2) * 1073741824),
              exportsLimit: limits?.maxExportsPerMonth || 10,
              projectsLimit: limits?.maxProjects || 5,
            },
          });
        }
      }

      const updated = await prisma.subscription.update({ where: { id: req.params.id }, data });
      return response.ok(res, updated);
    } catch (error) { next(error); }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, planId, billingCycle = 'MONTHLY', durationDays = 30 } = req.body;
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new NotFoundError('Plan');

      const now = new Date();
      const periodEnd = new Date(now.getTime() + durationDays * 86400000);

      const sub = await prisma.$transaction(async (tx) => {
        await tx.subscription.deleteMany({ where: { userId } });
        const s = await tx.subscription.create({
          data: {
            userId, planId, status: 'ACTIVE', billingCycle,
            gateway: 'MANUAL', manuallyAssigned: true,
            assignedByAdminId: req.adminSession?.sessionId,
            currentPeriodStart: now, currentPeriodEnd: periodEnd,
          },
        });
        const limits = plan.limits as any;
        await tx.subscriptionUsage.upsert({
          where: { userId },
          create: {
            subscriptionId: s.id, userId,
            creditsLimit: limits?.creditsPerMonth || 50,
            storageLimitBytes: BigInt((limits?.storageGb || 2) * 1073741824),
            exportsLimit: limits?.maxExportsPerMonth || 10,
            projectsLimit: limits?.maxProjects || 5,
            periodStart: now, periodEnd,
          },
          update: {
            subscriptionId: s.id, creditsUsed: 0, exportsCount: 0,
            creditsLimit: limits?.creditsPerMonth || 50,
            storageLimitBytes: BigInt((limits?.storageGb || 2) * 1073741824),
            exportsLimit: limits?.maxExportsPerMonth || 10,
            projectsLimit: limits?.maxProjects || 5,
            periodStart: now, periodEnd, lastResetAt: now,
          },
        });
        return s;
      });
      return response.created(res, sub);
    } catch (error) { next(error); }
  }

  static async adjustCredits(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { id: req.params.id }, include: { usage: true } });
      if (!sub || !sub.usage) throw new NotFoundError('Subscription');

      const { amount } = req.body;
      const newUsed = Math.max(0, Math.min(sub.usage.creditsLimit, sub.usage.creditsUsed + amount));

      await prisma.subscriptionUsage.update({
        where: { id: sub.usage.id }, data: { creditsUsed: newUsed },
      });
      return response.ok(res, { creditsUsed: newUsed, creditsLimit: sub.usage.creditsLimit });
    } catch (error) { next(error); }
  }
}
