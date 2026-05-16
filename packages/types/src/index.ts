export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
