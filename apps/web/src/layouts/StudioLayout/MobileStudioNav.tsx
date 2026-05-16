import React from 'react';
import { FileText, Image, Camera, Video, Music, Layers, Layout } from 'lucide-react';
import { useStudioStore } from '../../store/studio.store';
import { cn } from '../../utils/styles';
import styles from './MobileStudioNav.module.css';

const STAGES = [
  { id: 'script', label: 'Script', icon: FileText },
  { id: 'storyboard', label: 'Storyboard', icon: Layout },
  { id: 'keyframes', label: 'Keyframes', icon: Camera },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'assembly', label: 'Assembly', icon: Layers },
];

export function MobileStudioNav() {
  const { activeStageId, setActiveStage } = useStudioStore();

  return (
    <nav className={styles.container}>
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        const isActive = activeStageId === stage.id;

        return (
          <button
            key={stage.id}
            className={cn(styles.item, isActive && styles.active)}
            onClick={() => setActiveStage(stage.id)}
            aria-label={stage.label}
          >
            <Icon size={20} />
            <span className={styles.label}>{stage.label}</span>
            {isActive && <div className={styles.indicator} />}
          </button>
        );
      })}
    </nav>
  );
}
