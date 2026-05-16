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
  async getNotifications(params?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const response = await axios.get('/users/notifications', { params });
    return response.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await axios.post(`/users/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await axios.post('/users/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await axios.delete(`/users/notifications/${id}`);
  }
};
