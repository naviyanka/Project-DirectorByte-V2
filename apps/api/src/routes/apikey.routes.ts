import { Router } from 'express';
import { z } from 'zod';
import { ApiKeyController } from '../controllers/apikey.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const createKeySchema = z.object({
  module: z.enum(['CHAT', 'IMAGE_GEN', 'VIDEO_GEN', 'AUDIO_GEN', 'VOICEOVER']),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
});

const updateKeySchema = z.object({
  apiKey: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  provider: z.string().min(1).optional(),
});

// All API key routes require authentication
router.use(authenticate);

router.get('/providers', ApiKeyController.getProviders);
router.get('/', ApiKeyController.getKeys);
router.post('/', validateBody(createKeySchema), ApiKeyController.createKey);
router.patch('/:id', validateBody(updateKeySchema), ApiKeyController.updateKey);
router.delete('/:id', ApiKeyController.deleteKey);
router.post('/:id/test', ApiKeyController.testKey);

export default router;
