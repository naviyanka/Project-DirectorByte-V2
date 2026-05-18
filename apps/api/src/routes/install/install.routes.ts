import { Router } from 'express';
import { InstallController } from '../../controllers/install/install.controller';

const router = Router();

router.get('/status', InstallController.getStatus);
router.post('/check-db', InstallController.checkDb);
router.post('/setup', InstallController.setup);
router.post('/disable', InstallController.disable);

export default router;
