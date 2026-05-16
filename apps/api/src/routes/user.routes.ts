import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { UserController } from '../controllers/user.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, png, and webp formats are allowed'));
    }
  }
});

const updateMeSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  onboardingComplete: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  defaultExportFormat: z.string().optional(),
  autoSaveInterval: z.number().int().min(1).max(60).optional(),
});

const updateEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string()
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[0-9]/, 'Must contain at least one number')
});

const deleteAccountSchema = z.object({
  password: z.string(),
  confirmation: z.literal('DELETE')
});

// All user routes require authentication
router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', validateBody(updateMeSchema), UserController.updateMe);
router.patch('/me/profile', validateBody(updateProfileSchema), UserController.updateProfile);

router.put('/me/email', validateBody(updateEmailSchema), UserController.updateEmail);
router.put('/me/password', validateBody(updatePasswordSchema), UserController.updatePassword);

// Multer handles the file, so we don't use standard validateBody for the JSON body here
router.post('/me/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.delete('/me/avatar', UserController.deleteAvatar);

router.delete('/me', validateBody(deleteAccountSchema), UserController.deleteAccount);

router.get('/me/sessions', UserController.getSessions);
router.delete('/me/sessions/:id', UserController.deleteSession);

router.get('/me/export', UserController.exportData);

export default router;
