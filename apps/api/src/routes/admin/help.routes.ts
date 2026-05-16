import { Router } from 'express';
import { AdminHelpController } from '../../controllers/admin/help.controller';

const router = Router();
// Categories
router.get('/categories', AdminHelpController.listCategories);
router.post('/categories', AdminHelpController.createCategory);
router.patch('/categories/:id', AdminHelpController.updateCategory);
router.delete('/categories/:id', AdminHelpController.deleteCategory);
// Articles
router.get('/articles', AdminHelpController.listArticles);
router.post('/articles', AdminHelpController.createArticle);
router.patch('/articles/:id', AdminHelpController.updateArticle);
router.post('/articles/:id/publish', AdminHelpController.publishArticle);
router.post('/articles/:id/unpublish', AdminHelpController.unpublishArticle);
router.delete('/articles/:id', AdminHelpController.deleteArticle);

export default router;
