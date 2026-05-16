import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  planId?: string;
  subscription?: {
    status: string;
    planId: string;
  };
  onboardingComplete: boolean;
  emailVerified: boolean;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      initialized: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setToken: (token) => set({ accessToken: token }),
      setInitialized: (initialized) => set({ initialized }),
      
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        authService.logout().catch(() => {});
        // Optional: clear entire storage if needed
        // localStorage.removeItem('directorbyte-auth');
      },

      checkAuth: async () => {
        const { initialized } = get();
        if (initialized) return;

        try {
          set({ isLoading: true });
          // Attempt to refresh token using HttpOnly cookie
          const { accessToken } = await authService.refreshToken();
          set({ accessToken });
          
          // If refresh worked, fetch user profile
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false, initialized: true });
        } catch (error) {
          // If refresh fails, user is not authenticated
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, initialized: true });
        }
      },

      fetchUser: async () => {
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      },
    }),
    {
      name: 'directorbyte-auth',
      // Only persist the token if you want to keep it across tabs without refresh
      // But we use HttpOnly cookies for refresh, so persisting the short-lived accessToken is optional
      partialize: (state) => ({ user: state.user }),
    }
  )
);
