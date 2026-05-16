import { create } from 'zustand';

export interface Admin {
  username: string;
  role: 'SUPER_ADMIN' | 'SUPPORT';
  loggedInAt: string;
}

interface AdminState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAdmin: (admin: Admin | null) => void;
  logout: () => void;
  loginMock: (username: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: false,

  setAdmin: (admin) => set({ admin, isAuthenticated: !!admin }),
  
  logout: () => {
    set({ admin: null, isAuthenticated: false });
    // In real app, call API to clear cookie
  },

  loginMock: (username) => {
    const mockAdmin: Admin = {
      username,
      role: 'SUPER_ADMIN',
      loggedInAt: new Date().toISOString(),
    };
    set({ admin: mockAdmin, isAuthenticated: true });
  },
}));
