import { Router } from 'express';
import { HelpController } from '../controllers/help.controller';

const router = Router();
router.get('/categories', HelpController.getCategories);
router.get('/categories/:slug', HelpController.getCategory);
router.get('/articles/:slug', HelpController.getArticle);
router.get('/search', HelpController.search);
router.post('/articles/:slug/feedback', HelpController.articleFeedback);

export default router;
