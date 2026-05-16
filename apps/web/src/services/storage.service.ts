import axios from '../lib/axios';

export interface StorageStatus {
  provider: 'LOCAL' | 'GOOGLE_DRIVE' | 'GOOGLE_CLOUD_STORAGE';
  connected: boolean;
  drive?: {
    quotaBytes: number;
    usedBytes: number;
    syncEnabled: boolean;
    lastSyncedAt: string | null;
    error?: string;
  };
  usage: {
    usedByAppBytes: string;
    limitBytes: string;
  };
}

export const storageService = {
  async getStatus(): Promise<StorageStatus> {
    const response = await axios.get('/storage/status');
    return response.data.data;
  },

  async setProvider(provider: 'LOCAL' | 'GOOGLE_DRIVE' | 'GOOGLE_CLOUD_STORAGE'): Promise<{ provider: string }> {
    const response = await axios.post('/storage/provider', { provider });
    return response.data.data;
  },

  async syncDrive(): Promise<{ status: string; message: string }> {
    const response = await axios.post('/storage/sync');
    return response.data.data;
  },

  async getGoogleDriveConnectUrl(): Promise<{ authUrl: string }> {
    const response = await axios.post('/auth/google/drive-connect');
    return response.data.data;
  },

  async disconnectGoogleDrive(): Promise<void> {
    await axios.delete('/auth/google/drive-disconnect');
  }
};
