import { Router } from 'express';
import { AdminAuthController } from '../../controllers/admin/auth.controller';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

router.post('/login', AdminAuthController.login);
router.post('/logout', adminAuth, AdminAuthController.logout);
router.get('/me', adminAuth, AdminAuthController.getMe);

router.post('/2fa/setup', adminAuth, AdminAuthController.setup2FA);
router.post('/2fa/verify', AdminAuthController.verify2FA); // No adminAuth here because it's for login step 2

export default router;
