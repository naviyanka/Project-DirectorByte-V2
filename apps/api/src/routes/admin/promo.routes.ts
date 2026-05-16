import { Router } from 'express';
import { AdminPromoController } from '../../controllers/admin/promo.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/', AdminPromoController.list);
router.post('/', AdminPromoController.create);
router.patch('/:id', auditLogger('PROMO_UPDATED'), AdminPromoController.update);
router.delete('/:id', auditLogger('PROMO_DELETED'), AdminPromoController.deactivate);
router.get('/:id/redemptions', AdminPromoController.getRedemptions);
router.post('/generate-bulk', AdminPromoController.generateBulk);

export default router;
