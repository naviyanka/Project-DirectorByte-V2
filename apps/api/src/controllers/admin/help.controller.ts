import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export class AdminHelpController {
  // Categories
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const cats = await prisma.helpCategory.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { articles: true } } } });
      return response.ok(res, cats);
    } catch (error) { next(error); }
  }
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try { return response.created(res, await prisma.helpCategory.create({ data: req.body })); } catch (error) { next(error); }
  }
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try { return response.ok(res, await prisma.helpCategory.update({ where: { id: req.params.id }, data: req.body })); } catch (error) { next(error); }
  }
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try { await prisma.helpCategory.delete({ where: { id: req.params.id } }); return response.ok(res, { success: true }); } catch (error) { next(error); }
  }

  // Articles
  static async listArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const articles = await prisma.helpArticle.findMany({ orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } } } });
      return response.ok(res, articles);
    } catch (error) { next(error); }
  }
  static async createArticle(req: Request, res: Response, next: NextFunction) {
    try { return response.created(res, await prisma.helpArticle.create({ data: { ...req.body, status: 'DRAFT' } })); } catch (error) { next(error); }
  }
  static async updateArticle(req: Request, res: Response, next: NextFunction) {
    try { return response.ok(res, await prisma.helpArticle.update({ where: { id: req.params.id }, data: req.body })); } catch (error) { next(error); }
  }
  static async publishArticle(req: Request, res: Response, next: NextFunction) {
    try { return response.ok(res, await prisma.helpArticle.update({ where: { id: req.params.id }, data: { status: 'PUBLISHED' } })); } catch (error) { next(error); }
  }
  static async unpublishArticle(req: Request, res: Response, next: NextFunction) {
    try { return response.ok(res, await prisma.helpArticle.update({ where: { id: req.params.id }, data: { status: 'DRAFT' } })); } catch (error) { next(error); }
  }
  static async deleteArticle(req: Request, res: Response, next: NextFunction) {
    try { return response.ok(res, await prisma.helpArticle.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } })); } catch (error) { next(error); }
  }
}
