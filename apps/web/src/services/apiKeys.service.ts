import axios from '../lib/axios';

export interface ApiKey {
  id: string;
  module: string;
  provider: string;
  keyHint?: string;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: string;
  lastTestError?: string;
}

export const apiKeysService = {
  async getKeys(): Promise<ApiKey[]> {
    const response = await axios.get('/api-keys');
    return response.data.data;
  },

  async saveKey(data: {
    module: string;
    provider: string;
    key: string;
  }): Promise<ApiKey> {
    const response = await axios.post('/api-keys', data);
    return response.data.data;
  },

  async testKey(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`/api-keys/${id}/test`);
    return response.data.data;
  },

  async deleteKey(id: string): Promise<void> {
    await axios.delete(`/api-keys/${id}`);
  }
};
