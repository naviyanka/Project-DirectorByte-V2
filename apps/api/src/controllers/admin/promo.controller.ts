import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError, AppError } from '../../utils/errors';

export class AdminPromoController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, discountType } = req.query;
      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (discountType) where.discountType = discountType;

      const codes = await prisma.promoCode.findMany({ where, orderBy: { createdAt: 'desc' } });
      return response.ok(res, codes);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, code: (req.body.code as string).toUpperCase() };
      const code = await prisma.promoCode.create({ data });
      return response.created(res, code);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const code = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
      if (!code) throw new NotFoundError('Promo code');
      const updated = await prisma.promoCode.update({ where: { id: req.params.id }, data: req.body });
      return response.ok(res, updated);
    } catch (error) { next(error); }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const code = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
      if (!code) throw new NotFoundError('Promo code');
      if (code.currentRedemptions > 0) {
        await prisma.promoCode.update({ where: { id: req.params.id }, data: { isActive: false } });
      } else {
        await prisma.promoCode.delete({ where: { id: req.params.id } });
      }
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async getRedemptions(req: Request, res: Response, next: NextFunction) {
    try {
      const redemptions = await prisma.promoRedemption.findMany({
        where: { promoCodeId: req.params.id },
        include: { user: { select: { id: true, email: true } } },
        orderBy: { redeemedAt: 'desc' },
      });
      return response.ok(res, redemptions);
    } catch (error) { next(error); }
  }

  static async generateBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { count = 10, prefix = 'PROMO', ...promoFields } = req.body;
      const codes: string[] = [];
      for (let i = 0; i < Math.min(count, 100); i++) {
        const code = `${prefix}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await prisma.promoCode.create({ data: { ...promoFields, code } });
        codes.push(code);
      }
      return response.created(res, { generated: codes.length, codes });
    } catch (error) { next(error); }
  }
}
