import React from 'react';
import { Play, RotateCcw, Info, Settings, ChevronDown } from 'lucide-react';
import { Button, Card, Badge, ProgressBar, Select } from '../../../../design-system/components';
import { useStudioStore, StageStatus } from '../../../../store/studio.store';
import { cn } from '../../../../utils/styles';
import styles from './StageBase.module.css';

export interface StageBaseProps {
  stageId: string;
  stageNumber: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  onRun: () => void;
  isLoading?: boolean;
  progress?: number;
  eta?: string;
  providers?: Array<{ label: string; value: string }>;
  models?: Array<{ label: string; value: string }>;
  onProviderChange?: (provider: string) => void;
  onModelChange?: (model: string) => void;
}

export function StageBase({
  stageId,
  stageNumber,
  title,
  description,
  children,
  onRun,
  isLoading,
  progress,
  eta,
  providers = [],
  models = [],
  onProviderChange,
  onModelChange,
}: StageBaseProps) {
  const { 
    stageStatuses, 
    selectedProviders, 
    selectedModels,
    setProvider,
    setModel,
    toggleSettings 
  } = useStudioStore();
  
  const status = stageStatuses[stageId] || 'PENDING';
  const selectedProvider = selectedProviders[stageId] || providers[0]?.value;
  const selectedModel = selectedModels[stageId] || models[0]?.value;

  return (
    <div className={cn(styles.stageContainer, 'animate-fade-in')}>
      {/* Stage Header Card */}
      <Card className={styles.headerCard}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={styles.stageNumber}>{stageNumber}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={styles.title}>{title}</h2>
                <Badge variant={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'brand' : 'default'}>
                  {status.replace('_', ' ')}
                </Badge>
              </div>
              {description && <p className={styles.description}>{description}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" iconLeft={<Settings size={16} />} onClick={toggleSettings}>
              Settings
            </Button>
            <Button 
              variant="primary" 
              iconLeft={status === 'COMPLETED' ? <RotateCcw size={16} /> : <Play size={16} />}
              onClick={onRun}
              isLoading={isLoading}
            >
              {status === 'COMPLETED' ? 'Regenerate' : 'Run Stage'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-surface-200">
          <div className="space-y-1">
            <label className={styles.label}>AI Provider</label>
            <Select 
              value={selectedProvider} 
              onValueChange={(val: string) => {
                setProvider(stageId, val);
                onProviderChange?.(val);
              }}
              options={providers}
              size="sm"
            />
          </div>
          <div className="space-y-1">
            <label className={styles.label}>Model</label>
            <Select 
              value={selectedModel} 
              onValueChange={(val: string) => {
                setModel(stageId, val);
                onModelChange?.(val);
              }}
              options={models}
              size="sm"
            />
          </div>
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-hint">
                <span>Progress: {progress}%</span>
                {eta && <span>ETA: {eta}</span>}
              </div>
              <ProgressBar value={progress || 0} size="sm" variant="brand" animated />
            </div>
          )}
        </div>
      </Card>

      {/* Workspace Area */}
      <div className={styles.workspace}>
        {children}
      </div>
    </div>
  );
}
