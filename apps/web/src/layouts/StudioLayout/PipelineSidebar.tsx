import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Minus, Settings } from 'lucide-react';
import { useStudioStore, StageStatus } from '../../store/studio.store';
import { cn } from '../../utils/styles';
import styles from './PipelineSidebar.module.css';

const STAGES = [
  { id: 'script', label: 'Script', number: '01' },
  { id: 'storyboard', label: 'Storyboard', number: '02' },
  { id: 'keyframes', label: 'Keyframes', number: '03' },
  { id: 'images', label: 'Images', number: '04' },
  { id: 'video', label: 'Video', number: '05' },
  { id: 'audio', label: 'Audio', number: '06' },
  { id: 'assembly', label: 'Assembly', number: '07' },
];

export function PipelineSidebar() {
  const { activeStageId, setActiveStage, stageStatuses, toggleSettings } = useStudioStore();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Pipeline</span>
      </div>

      <nav className={styles.nav}>
        {STAGES.map((stage) => {
          const status = stageStatuses[stage.id] || 'PENDING';
          const isActive = activeStageId === stage.id;

          return (
            <button
              key={stage.id}
              className={cn(styles.navItem, isActive && styles.active)}
              onClick={() => setActiveStage(stage.id)}
            >
              <div className={styles.iconWrapper}>
                <StageIcon status={status} />
              </div>
              <div className={styles.content}>
                <span className={styles.number}>{stage.number}</span>
                <span className={styles.label}>{stage.label}</span>
              </div>
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button className={styles.settingsBtn} onClick={toggleSettings}>
          <Settings size={18} />
          <span>Pipeline Settings</span>
        </button>
      </div>
    </aside>
  );
}

function StageIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 size={18} className="text-success" />;
    case 'IN_PROGRESS':
      return <div className={styles.spinnerIcon} />;
    case 'FAILED':
      return <AlertCircle size={18} className="text-danger" />;
    case 'SKIPPED':
      return <Minus size={18} className="text-hint" />;
    default:
      return <Circle size={18} className="text-surface-400" />;
  }
}
