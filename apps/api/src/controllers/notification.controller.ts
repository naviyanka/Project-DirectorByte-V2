import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { response } from '../utils/response';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getUnread(req.user!.id);
      return response.ok(res, notifications);
    } catch (error) { next(error); }
  }

  static async readAll(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllRead(req.user!.id);
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async readOne(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markRead(req.user!.id, req.params.id);
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }
}
