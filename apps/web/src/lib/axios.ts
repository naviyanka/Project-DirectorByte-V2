import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { ApiError } from './errors';

// Use relative path to leverage the Vite proxy in development
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Sends HttpOnly refresh cookie automatically
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach access token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Handle 401 Unauthorized (Expired Access Token)
    // Don't try to refresh if the request itself was a refresh or logout attempt
    const isAuthRequest = originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/logout');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token using HttpOnly cookie
        // Note: Using raw axios here to avoid interceptors
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = response.data.data;

        useAuthStore.getState().setToken(accessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        // Redirect to signin if we're not already there
        if (!window.location.pathname.startsWith('/signin') && 
            !window.location.pathname.startsWith('/signup') &&
            !window.location.pathname.startsWith('/admin/login')) {
          window.location.href = `/signin?returnTo=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(ApiError.fromError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Normalize all other errors to ApiError
    return Promise.reject(ApiError.fromError(error));
  }
);

export default axiosInstance;
export { ApiError };
