import axios from '../lib/axios';

export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'FAILED' | 'GENERATING';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  currentStage: string;
  thumbnailUrl?: string;
  lastEditedAt: string;
  createdAt: string;
  genre?: string;
  style?: string;
  duration?: string;
  storageSizeBytes: string;
  pipelineConfig: any;
}

export interface UsageStats {
  credits: { used: number; total: number };
  storage: { used: string; total: string };
  projects: { used: number; total: number | 'unlimited' };
  exports: { used: number; total: number };
}

export interface GenerationJob {
  id: string;
  projectId: string;
  module: string;
  provider: string;
  model: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  progress: number;
  inputPayload: any;
  outputPayload?: any;
  errorMessage?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export const projectsService = {
  async getProjects(params?: { status?: string; search?: string; sort?: string; page?: number; perPage?: number }): Promise<Project[]> {
    const response = await axios.get('/projects', { params });
    return response.data.data;
  },

  async getRecentProjects(limit: number = 4): Promise<Project[]> {
    const response = await axios.get('/projects', { params: { sort: 'newest', perPage: limit } });
    return response.data.data;
  },

  async getProject(id: string): Promise<Project> {
    const response = await axios.get(`/projects/${id}`);
    return response.data.data;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await axios.post('/projects', data);
    return response.data.data;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await axios.patch(`/projects/${id}`, data);
    return response.data.data;
  },

  async deleteProject(id: string): Promise<void> {
    await axios.delete(`/projects/${id}`);
  },

  async duplicateProject(id: string): Promise<Project> {
    const response = await axios.post(`/projects/${id}/duplicate`);
    return response.data.data;
  },

  async getUsageStats(): Promise<UsageStats> {
    const response = await axios.get('/users/me'); 
    const user = response.data.data;
    return {
      credits: { used: user.subscriptionUsage?.creditsUsed || 0, total: user.subscriptionUsage?.creditsLimit || 0 },
      storage: { used: user.subscriptionUsage?.storageUsedBytes || '0', total: user.subscriptionUsage?.storageLimitBytes || '0' },
      projects: { used: user.subscriptionUsage?.projectsCount || 0, total: user.subscriptionUsage?.projectsLimit || 0 },
      exports: { used: user.subscriptionUsage?.exportsCount || 0, total: user.subscriptionUsage?.exportsLimit || 0 },
    };
  },

  // Studio Generation Jobs
  async generateAsset(data: {
    projectId: string;
    module: string;
    provider: string;
    model: string;
    inputPayload: any;
  }): Promise<GenerationJob> {
    const response = await axios.post('/studio/generate', data);
    return response.data.data;
  },

  async getJob(jobId: string): Promise<GenerationJob> {
    const response = await axios.get(`/studio/jobs/${jobId}`);
    return response.data.data;
  },

  async cancelJob(jobId: string): Promise<void> {
    await axios.delete(`/studio/jobs/${jobId}`);
  },

  async getJobs(params: { projectId?: string; status?: string }): Promise<any> {
    const response = await axios.get('/studio/jobs', { params });
    return response.data.data;
  }
};
