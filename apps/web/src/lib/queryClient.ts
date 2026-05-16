import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Something went wrong';
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        
        useUIStore.getState().addToast({
          title: 'Error',
          description: message,
          variant: 'error',
        });
      },
    },
  },
});
