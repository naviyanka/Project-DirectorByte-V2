import axios from '../lib/axios';

export const adminService = {
  // Stats & KPIs
  async getOverviewStats(): Promise<any> {
    const response = await axios.get('/admin/stats/overview');
    return response.data.data;
  },

  async getRevenueStats(): Promise<any> {
    const response = await axios.get('/admin/stats/revenue');
    return response.data.data;
  },

  // Users
  async getUsers(params: any): Promise<any> {
    const response = await axios.get('/admin/users', { params });
    return response.data.data;
  },

  async getUserDetails(id: string): Promise<any> {
    const response = await axios.get(`/admin/users/${id}`);
    return response.data.data;
  },

  async updateUser(id: string, data: any): Promise<any> {
    const response = await axios.patch(`/admin/users/${id}`, data);
    return response.data.data;
  },

  async impersonateUser(id: string): Promise<{ token: string }> {
    const response = await axios.post(`/admin/users/${id}/impersonate`);
    return response.data.data;
  },

  // Subscriptions
  async getSubscriptions(params: any): Promise<any> {
    const response = await axios.get('/admin/subscriptions', { params });
    return response.data.data;
  },

  // Support
  async getTickets(params: any): Promise<any> {
    const response = await axios.get('/admin/support/tickets', { params });
    return response.data.data;
  },

  async getTicket(id: string): Promise<any> {
    const response = await axios.get(`/admin/support/tickets/${id}`);
    return response.data.data;
  },

  async replyToTicket(id: string, message: string): Promise<any> {
    const response = await axios.post(`/admin/support/tickets/${id}/replies`, { message });
    return response.data.data;
  },

  // Settings
  async getSettings(): Promise<any> {
    const response = await axios.get('/admin/settings');
    return response.data.data;
  },

  async updateSetting(key: string, value: any): Promise<any> {
    const response = await axios.patch(`/admin/settings/${key}`, { value });
    return response.data.data;
  },

  // Audit
  async getAuditLogs(params: any): Promise<any> {
    const response = await axios.get('/admin/audit-logs', { params });
    return response.data.data;
  }
};
