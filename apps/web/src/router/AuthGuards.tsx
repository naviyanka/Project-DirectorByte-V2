import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Spinner } from '../design-system/components/Spinner/Spinner';

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, initialized } = useAuthStore();
  const location = useLocation();

  if (isLoading || !initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-0">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RequireGuest = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, initialized } = useAuthStore();

  if (isLoading || !initialized) {
    return null; // Don't flicker guest content if still checking
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export const RequireOnboarding = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();

  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
