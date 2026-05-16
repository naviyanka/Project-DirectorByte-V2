import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export class AdminSupportController {
  static async listTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, category, search, page = 1, perPage = 20 } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
      if (search) where.OR = [{ subject: { contains: search as string, mode: 'insensitive' } }];

      const total = await prisma.supportTicket.count({ where });
      const tickets = await prisma.supportTicket.findMany({
        where, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        skip: (Number(page) - 1) * Number(perPage), take: Number(perPage),
        include: { user: { select: { id: true, email: true, displayName: true } } },
      });
      return response.paginated(res, tickets, { page: Number(page), perPage: Number(perPage), total, totalPages: Math.ceil(total / Number(perPage)) });
    } catch (error) { next(error); }
  }

  static async getTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          user: { select: { id: true, email: true, displayName: true, subscription: { include: { plan: true } } } },
        },
      });
      if (!ticket) throw new NotFoundError('Ticket');
      return response.ok(res, ticket);
    } catch (error) { next(error); }
  }

  static async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, assignedToAdminId } = req.body;
      const updated = await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { status, priority, assignedToAdminId },
      });
      return response.ok(res, updated);
    } catch (error) { next(error); }
  }

  static async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket) throw new NotFoundError('Ticket');

      const msg = await prisma.$transaction(async (tx: any) => {
        const m = await tx.ticketMessage.create({
          data: { ticketId: ticket.id, senderId: req.adminSession!.sessionId, senderType: 'ADMIN', body: req.body.body },
        });
        const updateData: any = { status: 'WAITING_USER', lastRepliedAt: new Date() };
        if (!ticket.firstResponseAt) updateData.firstResponseAt = new Date();
        await tx.supportTicket.update({ where: { id: ticket.id }, data: updateData });
        return m;
      });
      return response.created(res, msg);
    } catch (error) { next(error); }
  }

  static async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await prisma.ticketInternalNote.create({
        data: { ticketId: req.params.id, adminId: req.adminSession!.sessionId, body: req.body.body },
      });
      return response.created(res, msg);
    } catch (error) { next(error); }
  }

  static async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status: 'CLOSED', closedAt: new Date() } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const [open, urgent, total, closed] = await Promise.all([
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } } }),
        prisma.supportTicket.count({ where: { priority: 'URGENT', status: { not: 'CLOSED' } } }),
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      ]);
      return response.ok(res, {
        openTickets: open, urgentTickets: urgent,
        totalTickets: total, closedTickets: closed,
        resolutionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      });
    } catch (error) { next(error); }
  }

  static async listCannedResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const responses = await prisma.cannedResponse.findMany({ orderBy: { title: 'asc' } });
      return response.ok(res, responses);
    } catch (error) { next(error); }
  }

  static async createCannedResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const cr = await prisma.cannedResponse.create({ data: req.body });
      return response.created(res, cr);
    } catch (error) { next(error); }
  }

  static async updateCannedResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const cr = await prisma.cannedResponse.update({ where: { id: req.params.id }, data: req.body });
      return response.ok(res, cr);
    } catch (error) { next(error); }
  }

  static async deleteCannedResponse(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.cannedResponse.delete({ where: { id: req.params.id } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }
}
