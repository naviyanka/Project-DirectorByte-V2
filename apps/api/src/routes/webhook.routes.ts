import { Router } from 'express';
import express from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Stripe requires the raw body for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), WebhookController.handleStripe);

export default router;
