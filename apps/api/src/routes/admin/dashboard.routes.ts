import { Router } from 'express';
import { AdminDashboardController } from '../../controllers/admin/dashboard.controller';

const router = Router();
router.get('/kpis', AdminDashboardController.getKpis);
router.get('/charts', AdminDashboardController.getCharts);
router.get('/activity', AdminDashboardController.getActivity);

export default router;
