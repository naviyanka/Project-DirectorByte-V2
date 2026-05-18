import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from '../../lib/axios';

export const InstallGuard = ({ children }: { children: React.ReactNode }) => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkInstall = async () => {
      try {
        const response = await axios.get('/install/status');
        setIsInstalled(response.data.data.installed);
      } catch (error: any) {
        if (error?.response?.status === 403 && error?.response?.data?.error?.code === 'NOT_INSTALLED') {
          setIsInstalled(false);
        } else {
          setIsInstalled(true); // Fallback to true to not block app if endpoint fails for other reasons
        }
      }
    };
    checkInstall();
  }, []);

  if (isInstalled === null) {
    return <div className="flex h-screen w-screen items-center justify-center bg-surface-0"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isInstalled && location.pathname !== '/install') {
    return <Navigate to="/install" replace />;
  }

  if (isInstalled && location.pathname === '/install') {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
