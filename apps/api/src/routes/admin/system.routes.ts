import { Router } from 'express';
import { AdminSystemController } from '../../controllers/admin/system.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/providers', AdminSystemController.getProviders);
router.get('/settings', AdminSystemController.getSettings);
router.patch('/settings', auditLogger('SYSTEM_SETTING_CHANGED'), AdminSystemController.updateSetting);
router.post('/maintenance', auditLogger('SYSTEM_SETTING_CHANGED'), AdminSystemController.setMaintenance);
router.get('/health', AdminSystemController.healthCheck);
router.post('/email/test', AdminSystemController.testEmail);
router.get('/feature-flags', AdminSystemController.getFeatureFlags);
router.patch('/feature-flags/:flag', auditLogger('FEATURE_FLAG_CHANGED'), AdminSystemController.toggleFeatureFlag);

router.get('/email-templates', AdminSystemController.getEmailTemplates);
router.get('/email-templates/:key', AdminSystemController.getEmailTemplate);
router.patch('/email-templates/:key', auditLogger('EMAIL_TEMPLATE_UPDATED'), AdminSystemController.updateEmailTemplate);
router.post('/email-templates/:key/preview', AdminSystemController.previewEmailTemplate);
router.post('/email-templates/:key/reset', auditLogger('EMAIL_TEMPLATE_UPDATED'), AdminSystemController.resetEmailTemplate);

export default router;
