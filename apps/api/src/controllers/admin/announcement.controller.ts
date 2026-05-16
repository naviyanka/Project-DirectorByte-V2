import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export class AdminAnnouncementController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
      return response.ok(res, announcements);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const a = await prisma.announcement.create({ data: req.body });
      return response.created(res, a);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const a = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!a) throw new NotFoundError('Announcement');
      const updated = await prisma.announcement.update({ where: { id: req.params.id }, data: req.body });
      return response.ok(res, updated);
    } catch (error) { next(error); }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const a = await prisma.announcement.findUnique({ where: { id: req.params.id } });
      if (!a) throw new NotFoundError('Announcement');
      await prisma.announcement.delete({ where: { id: req.params.id } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.announcement.update({ where: { id: req.params.id }, data: { isActive: true } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.announcement.update({ where: { id: req.params.id }, data: { isActive: false } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  /** User-facing: active announcements for the authenticated user */
  static async getActiveForUser(req: Request, res: Response, next: NextFunction) {
    try {
      const announcements = await prisma.announcement.findMany({
        where: { isActive: true, startsAt: { lte: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      return response.ok(res, announcements);
    } catch (error) { next(error); }
  }
}
