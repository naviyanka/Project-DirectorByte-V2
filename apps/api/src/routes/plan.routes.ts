import { Router } from 'express';
import { PlanController } from '../controllers/plan.controller';

const router = Router();

router.get('/', PlanController.getPlans);
router.get('/:slug', PlanController.getPlan);

export default router;
