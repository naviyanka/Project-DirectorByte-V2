import { Router } from 'express';
import { z } from 'zod';
import { ProjectController } from '../controllers/project.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  genre: z.string().optional(),
  style: z.string().optional(),
  duration: z.string().optional(),
  pipelineConfig: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  genre: z.string().optional(),
  style: z.string().optional(),
  duration: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  pipelineConfig: z.record(z.any()).optional(),
});

const setStatusSchema = z.object({
  status: z.enum(['DRAFT', 'GENERATING', 'COMPLETED', 'ARCHIVED', 'FAILED']),
});

const createVersionSchema = z.object({
  snapshot: z.record(z.any()),
  triggeredBy: z.string().optional(),
});

// Public shared route
router.get('/shared/:token', ProjectController.getSharedProject);

// All other routes require auth
router.use(authenticate);

router.get('/', ProjectController.getProjects);
router.post('/', validateBody(createProjectSchema), ProjectController.createProject);
router.get('/:id', ProjectController.getProject);
router.patch('/:id', validateBody(updateProjectSchema), ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

router.post('/:id/restore', ProjectController.restoreProject);
router.post('/:id/duplicate', ProjectController.duplicateProject);
router.post('/:id/status', validateBody(setStatusSchema), ProjectController.setStatus);

router.post('/:id/autosave', validateBody(createVersionSchema), ProjectController.createVersion);
router.get('/:id/versions', ProjectController.getVersions);
router.get('/:id/versions/:versionId', ProjectController.getVersionSnapshot);
router.post('/:id/versions/:versionId/restore', ProjectController.restoreVersion);

router.post('/:id/share', ProjectController.shareProject);
router.delete('/:id/share', ProjectController.unshareProject);

router.post('/:id/thumbnail', ProjectController.setThumbnail);
router.delete('/:id/thumbnail', ProjectController.removeThumbnail);

export default router;
