import axios from '../lib/axios';
import { User } from '../store/auth.store';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password?: string;
  promoCode?: string;
}

export const authService = {
  async login(data: LoginPayload): Promise<AuthResponse> {
    const response = await axios.post('/auth/login', data);
    return response.data.data;
  },

  async register(data: RegisterPayload): Promise<{ message: string }> {
    const response = await axios.post('/auth/register', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axios.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await axios.post(`/auth/reset-password/${token}`, { password });
  },

  async verifyEmail(token: string): Promise<void> {
    await axios.get(`/auth/verify-email?token=${token}`);
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await axios.post('/auth/resend-verification', { email });
    return response.data.data;
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await axios.post('/auth/refresh');
    return response.data.data;
  },

  getGoogleAuthUrl(): string {
    const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
    return `${API_URL}/auth/google`;
  },

  async getMe(): Promise<User> {
    const response = await axios.get('/users/me');
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await axios.patch('/users/me', data);
    return response.data.data;
  }
};
