import { Router } from 'express';
import { AdminAuditController } from '../../controllers/admin/audit.controller';

const router = Router();
router.get('/', AdminAuditController.list);
router.get('/export', AdminAuditController.exportCsv);

export default router;
