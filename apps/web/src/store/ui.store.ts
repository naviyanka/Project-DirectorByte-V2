import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

interface UIState {
  theme: 'dark' | 'light' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toasts: ToastMessage[];
  activeModal: string | null;
  dismissedAnnouncements: string[];

  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  dismissAnnouncement: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,
      sidebarCollapsed: false,
      toasts: [],
      activeModal: null,
      dismissedAnnouncements: [],

      setTheme: (theme) => {
        set({ theme });
        if (theme !== 'system') {
          document.documentElement.setAttribute('data-theme', theme);
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      addToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).substring(2, 9) }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      dismissAnnouncement: (id) => set((state) => ({
        dismissedAnnouncements: [...state.dismissedAnnouncements, id]
      })),
    }),
    {
      name: 'directorbyte-ui',
      partialize: (state) => ({ 
        theme: state.theme, 
        sidebarCollapsed: state.sidebarCollapsed,
        dismissedAnnouncements: state.dismissedAnnouncements 
      }),
    }
  )
);
