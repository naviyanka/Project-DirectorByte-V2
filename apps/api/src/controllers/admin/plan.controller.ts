import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export class AdminPlanController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
      const withCounts = await Promise.all(plans.map(async (p) => ({
        ...p, subscriberCount: await prisma.subscription.count({ where: { planId: p.id, status: { in: ['ACTIVE', 'TRIALING'] } } }),
      })));
      return response.ok(res, withCounts);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await prisma.plan.create({ data: req.body });
      return response.created(res, plan);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError('Plan');
      const updated = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
      return response.ok(res, updated);
    } catch (error) { next(error); }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.plan.update({ where: { id: req.params.id }, data: { isActive: false, isPublic: false } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError('Plan');
      const { id, createdAt, updatedAt, ...rest } = plan;
      const copy = await prisma.plan.create({ data: { ...rest, name: `${plan.name} (Copy)`, slug: `${plan.slug}-copy-${Date.now()}` } as any });
      return response.created(res, copy);
    } catch (error) { next(error); }
  }
}
