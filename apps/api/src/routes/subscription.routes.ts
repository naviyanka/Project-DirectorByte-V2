import { Router } from 'express';
import { z } from 'zod';
import { SubscriptionController } from '../controllers/subscription.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const checkoutSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
  promoCode: z.string().optional(),
});

const cancelSchema = z.object({
  immediately: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

const changeCycleSchema = z.object({
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
});

const applyPromoSchema = z.object({
  code: z.string().min(1),
});

router.use(authenticate);

router.get('/me', SubscriptionController.getMySubscription);
router.post('/checkout', validateBody(checkoutSchema), SubscriptionController.checkout);
router.post('/cancel', validateBody(cancelSchema), SubscriptionController.cancel);
router.post('/reactivate', SubscriptionController.reactivate);
router.post('/change-billing-cycle', validateBody(changeCycleSchema), SubscriptionController.changeBillingCycle);
router.post('/apply-promo', validateBody(applyPromoSchema), SubscriptionController.applyPromo);
router.get('/invoices', SubscriptionController.getInvoices);
router.get('/invoices/:id/pdf', SubscriptionController.getInvoicePdf);

export default router;
