import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);
router.get('/', NotificationController.list);
router.post('/read-all', NotificationController.readAll);
router.patch('/:id/read', NotificationController.readOne);

export default router;
