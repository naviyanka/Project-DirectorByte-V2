import { Router } from 'express';
import { AdminSubscriptionController } from '../../controllers/admin/subscription.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/', AdminSubscriptionController.list);
router.patch('/:id', auditLogger('SUBSCRIPTION_CHANGED'), AdminSubscriptionController.update);
router.post('/assign', auditLogger('SUBSCRIPTION_ASSIGNED'), AdminSubscriptionController.assign);
router.post('/:id/adjust-credits', auditLogger('CREDITS_ADJUSTED'), AdminSubscriptionController.adjustCredits);

export default router;
