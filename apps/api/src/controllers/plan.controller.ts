import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export class PlanController {
  /** GET /plans — public, returns active public plans */
  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: 'asc' },
      });
      return response.ok(res, plans);
    } catch (error) { next(error); }
  }

  /** GET /plans/:slug — public, single plan detail */
  static async getPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await prisma.plan.findUnique({ where: { slug: req.params.slug } });
      if (!plan || !plan.isActive) throw new NotFoundError('Plan');
      return response.ok(res, plan);
    } catch (error) { next(error); }
  }
}
