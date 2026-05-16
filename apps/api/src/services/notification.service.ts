import { prisma } from '../config/database';

export class NotificationService {
  static async create(userId: string, type: string, title: string, body: string, link?: string) {
    return prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  }

  static async getUnread(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}
