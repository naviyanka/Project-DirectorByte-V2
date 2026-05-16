import { Router } from 'express';
import { StudioController } from '../controllers/studio.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/jobs', StudioController.getJobs);
router.get('/jobs/:id', StudioController.getJob);
router.delete('/jobs/:id', StudioController.cancelJob);

router.post('/generate', StudioController.generate);
router.post('/transcribe', StudioController.transcribe);
router.get('/voices', StudioController.getVoices);

export default router;
