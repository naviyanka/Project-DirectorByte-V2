import { Request, Response, NextFunction } from 'express';
import { response } from '../utils/response';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
  static async getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.getMySubscription(req.user!.id);
      if (!sub) return response.notFound(res, 'Subscription');
      return response.ok(res, sub);
    } catch (error) { next(error); }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId, billingCycle, promoCode } = req.body;
      const result = await SubscriptionService.checkout(req.user!.id, planId, billingCycle, promoCode);
      return response.ok(res, result);
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { immediately, reason } = req.body;
      const result = await SubscriptionService.cancel(req.user!.id, immediately, reason);
      return response.ok(res, result);
    } catch (error) { next(error); }
  }

  static async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.reactivate(req.user!.id);
      return response.ok(res, result);
    } catch (error) { next(error); }
  }

  static async changeBillingCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { billingCycle } = req.body;
      const result = await SubscriptionService.changeBillingCycle(req.user!.id, billingCycle);
      return response.ok(res, result);
    } catch (error) { next(error); }
  }

  static async applyPromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const result = await SubscriptionService.applyPromo(req.user!.id, code);
      return response.ok(res, result);
    } catch (error) { next(error); }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 20;
      const result = await SubscriptionService.getInvoices(req.user!.id, page, perPage);
      return response.paginated(res, result.data, result.meta);
    } catch (error) { next(error); }
  }

  static async getInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfUrl = await SubscriptionService.getInvoicePdfUrl(req.user!.id, req.params.id);
      if (!pdfUrl) return response.notFound(res, 'Invoice PDF');
      return res.redirect(pdfUrl);
    } catch (error) { next(error); }
  }
}
