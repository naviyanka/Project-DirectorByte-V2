import { Router } from 'express';
import { AdminPlanController } from '../../controllers/admin/plan.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/', AdminPlanController.list);
router.post('/', AdminPlanController.create);
router.patch('/:id', auditLogger('PLAN_UPDATED'), AdminPlanController.update);
router.post('/:id/archive', auditLogger('PLAN_UPDATED'), AdminPlanController.archive);
router.post('/:id/duplicate', AdminPlanController.duplicate);

export default router;
