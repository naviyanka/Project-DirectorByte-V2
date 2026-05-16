import { Router } from 'express';
import { AdminUserController } from '../../controllers/admin/user.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.get('/', AdminUserController.listUsers);
router.get('/:id', AdminUserController.getUser);
router.patch('/:id', auditLogger('USER_UPDATED'), AdminUserController.updateUser);
router.post('/:id/suspend', auditLogger('USER_SUSPENDED'), AdminUserController.suspendUser);
router.post('/:id/ban', auditLogger('USER_BANNED'), AdminUserController.banUser);
router.post('/:id/enable', auditLogger('USER_ENABLED'), AdminUserController.enableUser);
router.post('/:id/reset-password', auditLogger('PASSWORD_RESET'), AdminUserController.resetPassword);
router.post('/:id/impersonate', auditLogger('IMPERSONATION_START'), AdminUserController.impersonate);
router.delete('/:id/impersonate', auditLogger('IMPERSONATION_END'), AdminUserController.endImpersonation);
router.post('/:id/send-email', AdminUserController.sendEmailToUser);
router.delete('/:id/sessions/:sessionId', AdminUserController.deleteSession);
router.delete('/:id/sessions', AdminUserController.deleteAllSessions);

export default router;
