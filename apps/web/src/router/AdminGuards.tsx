import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../store/admin.store';

export function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
