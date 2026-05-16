import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import adminAuthRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import subscriptionRoutes from './subscription.routes';
import planRoutes from './plan.routes';
import promoRoutes from './promo.routes';
import systemRoutes from './system.routes';
import auditRoutes from './audit.routes';
import announcementRoutes from './announcement.routes';
import supportRoutes from './support.routes';
import helpRoutes from './help.routes';

const router = Router();

// Auth routes (login is public, others need admin session)
router.use('/auth', adminAuthRoutes);

// All routes below require admin authentication
router.use(adminAuth);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes);
router.use('/promo-codes', promoRoutes);
router.use('/system', systemRoutes);
router.use('/audit', auditRoutes);
router.use('/announcements', announcementRoutes);
router.use('/support', supportRoutes);
router.use('/help', helpRoutes);

export default router;
