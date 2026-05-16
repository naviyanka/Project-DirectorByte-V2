import axios from '../lib/axios';

export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsService = {
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const response = await axios.get('/notifications', { params: { unreadOnly } });
    return response.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await axios.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await axios.post('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await axios.delete(`/notifications/${id}`);
  }
};
