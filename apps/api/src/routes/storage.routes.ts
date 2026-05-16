import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { StorageController } from '../controllers/storage.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for general uploads (enforced tighter in controller if needed)
});

const setProviderSchema = z.object({
  provider: z.enum(['LOCAL', 'GOOGLE_DRIVE', 'GOOGLE_CLOUD_STORAGE']),
});

router.use(authenticate);

router.get('/status', StorageController.getStatus);
router.post('/provider', validateBody(setProviderSchema), StorageController.setProvider);
router.post('/sync', StorageController.syncDrive);
router.post('/upload', upload.single('file'), StorageController.uploadFile);
router.delete('/files/:fileId', StorageController.deleteFile);

export default router;
