import React from 'react';
import { AppLayout } from './AppLayout';
import { ShieldAlert } from 'lucide-react';
import styles from './AdminLayout.module.css';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.adminTheme}>
      <div className={styles.adminBanner}>
        <ShieldAlert size={14} />
        <span>Admin Mode — DirectorByte Management Center</span>
      </div>
      <AppLayout>
        {children}
      </AppLayout>
    </div>
  );
}
