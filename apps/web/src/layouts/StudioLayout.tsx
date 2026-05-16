import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Save, Play, Monitor } from 'lucide-react';
import { Button } from '../design-system/components/Button/Button';
import { cn } from '../utils/styles';
import styles from './StudioLayout.module.css';

export interface StudioLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function StudioLayout({ children, title = 'New Project' }: StudioLayoutProps) {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className={styles.container}>
      {/* Studio Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="sm" iconLeft={<ChevronLeft size={16} />}>
            Exit
          </Button>
          <div className={styles.divider} />
          <div className={styles.projectInfo}>
            <Film size={18} className="text-brand-400" />
            <span className={styles.projectTitle}>{title}</span>
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          <div className={styles.stepIndicator}>
            <div className={cn(styles.step, styles.active)}>1. Script</div>
            <div className={styles.step}>2. Storyboard</div>
            <div className={styles.step}>3. Produce</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <Button variant="ghost" size="sm" iconLeft={<Save size={16} />}>Save</Button>
          <Button variant="primary" size="sm" iconLeft={<Play size={16} />}>Preview</Button>
        </div>
      </header>

      <div className={styles.workspace}>
        {/* Stage Sidebar */}
        <aside className={styles.stageSidebar}>
          <div className={styles.stageItemActive}>
            <Monitor size={20} />
          </div>
        </aside>

        {/* Main Canvas */}
        <main className={styles.canvas}>
          <div className={styles.canvasInner}>
            {children}
          </div>
        </main>

        {/* Properties Drawer */}
        <aside className={cn(styles.propertiesPanel, !rightPanelOpen && styles.closed)}>
          <button 
            className={styles.toggleButton} 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          
          <div className={styles.panelContent}>
            <h4 className={styles.panelTitle}>Properties</h4>
            {/* Contextual properties go here */}
          </div>
        </aside>
      </div>
    </div>
  );
}
