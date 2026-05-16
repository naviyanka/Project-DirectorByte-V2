import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import apikeyRoutes from './apikey.routes';
import projectRoutes from './project.routes';
import storageRoutes from './storage.routes';
import studioRoutes from './studio.routes';
import planRoutes from './plan.routes';
import subscriptionRoutes from './subscription.routes';
import webhookRoutes from './webhook.routes';
import supportRoutes from './support.routes';
import helpRoutes from './help.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin/index';
import { AdminAnnouncementController } from '../controllers/admin/announcement.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Health Check
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'ok';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    }
  });
});

// Version
router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: '2.0.0',
    environment: env.NODE_ENV,
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/api-keys', apikeyRoutes);
router.use('/projects', projectRoutes);
router.use('/storage', storageRoutes);
router.use('/studio', studioRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/support', supportRoutes);
router.use('/help', helpRoutes);
router.use('/notifications', notificationRoutes);

// User-facing announcements
router.get('/announcements', authenticate, AdminAnnouncementController.getActiveForUser);

// Admin routes
router.use('/admin', adminRoutes);

export default router;
