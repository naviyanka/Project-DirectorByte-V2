import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar/Sidebar';
import { Topbar } from './Topbar/Topbar';
import { GlobalSearch } from '../design-system/components/GlobalSearch/GlobalSearch';
import { NewProjectModal } from '../features/projects/NewProjectModal';
import { useUIStore } from '../store/ui.store';
import { cn } from '../utils/styles';
import { UsageBanner } from '../pages/subscription/components/UsageBanner';
import { projectsService } from '../services/projects.service';
import { slideUp } from '../lib/motion';
import { KeyboardShortcutsModal } from '../features/shared/KeyboardShortcutsModal';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, sidebarOpen, toggleSidebar, dismissedAnnouncements, dismissAnnouncement } = useUIStore();
  const location = useLocation();
  const outlet = useOutlet();

  const { data: usage } = useQuery({
    queryKey: ['usageStats'],
    queryFn: () => projectsService.getUsageStats(),
    refetchInterval: 300000, // 5 min
  });

  const showUsageWarning = usage && 
    (usage.credits.used / usage.credits.total >= 0.8) && 
    !dismissedAnnouncements.includes('usage-warning');

  return (
    <div className={styles.container}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      
      <Sidebar />
      
      <div className={cn(
        styles.mainWrapper,
        sidebarCollapsed ? styles.collapsed : styles.expanded
      )}>
        <Topbar />
        
        {showUsageWarning && (
          <UsageBanner 
            type={usage.credits.used >= usage.credits.total ? 'EXHAUSTED' : 'WARNING'} 
            credits={usage.credits.used} 
            total={usage.credits.total} 
            onDismiss={() => dismissAnnouncement('usage-warning')} 
          />
        )}

        <main id="main-content" className={styles.content}>
          <div className={styles.innerContent}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideUp}
                className={styles.pageWrapper}
              >
                {children || outlet}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <GlobalSearch />
      <NewProjectModal />
      <KeyboardShortcutsModal />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
