import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export class HelpController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.helpCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
      });
      return response.ok(res, categories.map((c: any) => ({ ...c, articleCount: c._count.articles })));
    } catch (error) { next(error); }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const cat = await prisma.helpCategory.findUnique({
        where: { slug: req.params.slug },
        include: { articles: { where: { status: 'PUBLISHED' }, select: { id: true, title: true, slug: true, excerpt: true, views: true, createdAt: true } } },
      });
      if (!cat) throw new NotFoundError('Category');
      return response.ok(res, cat);
    } catch (error) { next(error); }
  }

  static async getArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await prisma.helpArticle.findUnique({
        where: { slug: req.params.slug },
        include: { category: true },
      });
      if (!article || article.status !== 'PUBLISHED') throw new NotFoundError('Article');

      // Increment views
      await prisma.helpArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });

      // Related articles
      const related = await prisma.helpArticle.findMany({
        where: { categoryId: article.categoryId, id: { not: article.id }, status: 'PUBLISHED' },
        take: 3, select: { id: true, title: true, slug: true, excerpt: true },
      });

      return response.ok(res, { article, relatedArticles: related });
    } catch (error) { next(error); }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      if (!q || q.length < 2) return response.ok(res, []);

      const results = await prisma.helpArticle.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
        select: { id: true, title: true, slug: true, excerpt: true, categoryId: true },
      });
      return response.ok(res, results);
    } catch (error) { next(error); }
  }

  static async articleFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await prisma.helpArticle.findUnique({ where: { slug: req.params.slug } });
      if (!article) throw new NotFoundError('Article');

      const { helpful } = req.body;
      const field = helpful ? 'helpfulCount' : 'notHelpfulCount';
      await prisma.helpArticle.update({ where: { id: article.id }, data: { [field]: { increment: 1 } } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }
}
