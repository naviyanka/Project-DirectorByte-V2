import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError, AppError } from '../utils/errors';

export class SupportController {
  /** POST /support/tickets — create a ticket */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, body, category, priority } = req.body;
      const autoCloseDays = await prisma.systemSetting.findUnique({ where: { key: 'support.autoCloseDays' } });
      const days = autoCloseDays ? parseInt(autoCloseDays.value) : 14;

      const ticket = await prisma.$transaction(async (tx) => {
        const t = await tx.supportTicket.create({
          data: {
            userId: req.user!.id,
            subject, category: category || 'OTHER',
            priority: priority || 'MEDIUM', status: 'OPEN',
            autoCloseAt: new Date(Date.now() + days * 86400000),
          },
        });
        await tx.ticketMessage.create({
          data: { ticketId: t.id, senderId: req.user!.id, senderType: 'USER', body },
        });
        return t;
      });

      return response.created(res, ticket);
    } catch (error) { next(error); }
  }

  /** GET /support/tickets — list user's tickets */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page = 1, perPage = 20 } = req.query;
      const where: any = { userId: req.user!.id };
      if (status) where.status = status;

      const total = await prisma.supportTicket.count({ where });
      const tickets = await prisma.supportTicket.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(perPage), take: Number(perPage),
        select: { id: true, subject: true, status: true, priority: true, category: true, lastRepliedAt: true, createdAt: true },
      });
      return response.paginated(res, tickets, { page: Number(page), perPage: Number(perPage), total, totalPages: Math.ceil(total / Number(perPage)) });
    } catch (error) { next(error); }
  }

  /** GET /support/tickets/:id — ticket detail */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!ticket || ticket.userId !== req.user!.id) throw new NotFoundError('Ticket');

      // Mark unread messages as read
      await prisma.ticketMessage.updateMany({
        where: { ticketId: ticket.id, senderType: 'ADMIN', isRead: false },
        data: { isRead: true },
      });

      return response.ok(res, ticket);
    } catch (error) { next(error); }
  }

  /** POST /support/tickets/:id/reply */
  static async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.userId !== req.user!.id) throw new NotFoundError('Ticket');
      if (ticket.status === 'CLOSED') throw new AppError('Cannot reply to a closed ticket', 400, 'TICKET_CLOSED');

      const autoCloseDays = 14;
      const msg = await prisma.$transaction(async (tx) => {
        const m = await tx.ticketMessage.create({
          data: { ticketId: ticket.id, senderId: req.user!.id, senderType: 'USER', body: req.body.body },
        });
        const newStatus = ['RESOLVED', 'WAITING_USER'].includes(ticket.status) ? 'OPEN' : ticket.status;
        await tx.supportTicket.update({
          where: { id: ticket.id },
          data: { status: newStatus as any, lastRepliedAt: new Date(), autoCloseAt: new Date(Date.now() + autoCloseDays * 86400000) },
        });
        return m;
      });
      return response.created(res, msg);
    } catch (error) { next(error); }
  }

  /** POST /support/tickets/:id/close */
  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.userId !== req.user!.id) throw new NotFoundError('Ticket');

      await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }
}
