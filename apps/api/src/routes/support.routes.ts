import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.post('/tickets', SupportController.create);
router.get('/tickets', SupportController.list);
router.get('/tickets/:id', SupportController.get);
router.post('/tickets/:id/reply', SupportController.reply);
router.post('/tickets/:id/close', SupportController.close);

export default router;
