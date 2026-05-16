import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { HelmetProvider } from 'react-helmet-async';
import { router } from './router';
import { useAuthStore } from './store/auth.store';
import { ToastProvider, ToastViewport } from './design-system/components/Toast/Toast';
import { ErrorBoundary } from './lib/ErrorBoundary';
import './design-system/tokens.css';
import './design-system/base.css';

const Main = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ToastProvider>
          <ErrorBoundary>
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-surface-0"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}>
              <RouterProvider router={router} />
            </React.Suspense>
          </ErrorBoundary>
          <ToastViewport />
        </ToastProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
