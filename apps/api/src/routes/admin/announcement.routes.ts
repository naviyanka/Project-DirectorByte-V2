import { Router } from 'express';
import { AdminAnnouncementController } from '../../controllers/admin/announcement.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/', AdminAnnouncementController.list);
router.post('/', AdminAnnouncementController.create);
router.patch('/:id', auditLogger('SYSTEM_SETTING_CHANGED'), AdminAnnouncementController.update);
router.delete('/:id', AdminAnnouncementController.remove);
router.post('/:id/activate', AdminAnnouncementController.activate);
router.post('/:id/deactivate', AdminAnnouncementController.deactivate);

export default router;
