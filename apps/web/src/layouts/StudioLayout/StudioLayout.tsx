import React from 'react';
import { StudioTopbar } from './StudioTopbar';
import { PipelineSidebar } from './PipelineSidebar';
import { MobileStudioNav } from './MobileStudioNav';
import { useStudioStore } from '../../store/studio.store';
import { cn } from '../../utils/styles';
import styles from './StudioLayout.module.css';

export interface StudioLayoutProps {
  children: React.ReactNode;
}

export function StudioLayout({ children }: StudioLayoutProps) {
  const { isSettingsOpen, toggleSettings } = useStudioStore();

  return (
    <div className={styles.container}>
      <StudioTopbar />
      
      <div className={styles.workspace}>
        <PipelineSidebar />
        
        <main className={styles.main}>
          <div className={styles.content}>
            {children}
          </div>
        </main>

        <aside className={cn(styles.settingsDrawer, isSettingsOpen && styles.drawerOpen)}>
          <div className={styles.drawerHeader}>
            <h3>Settings</h3>
            <button onClick={toggleSettings}>&times;</button>
          </div>
          <div className={styles.drawerContent}>
            {/* Stage settings will go here */}
            <p className="text-muted text-sm p-4">Select a stage to view its settings.</p>
          </div>
        </aside>
      </div>

      <MobileStudioNav />
    </div>
  );
}
