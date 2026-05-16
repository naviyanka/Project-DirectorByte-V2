import React, { useState } from 'react';
import { Film, Music, Mic, Type, Plus, Play, Pause, SkipBack, SkipForward, Download, Save, Layers } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Badge, ProgressBar } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { cn } from '../../../../utils/styles';
import styles from './AssemblyStage.module.css';

export function AssemblyStage() {
  const { stageOutputs, setStageStatus } = useStudioStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 105; // 1:45 in seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tracks = [
    { id: 'video', label: 'Video', icon: <Film size={14} />, color: 'bg-brand-500', clips: [{ start: 0, end: 10, label: 'Scene 01' }, { start: 10, end: 25, label: 'Scene 02' }] },
    { id: 'audio', label: 'Audio', icon: <Music size={14} />, color: 'bg-success-500', clips: [{ start: 0, end: 105, label: 'Cinematic Score' }] },
    { id: 'voice', label: 'Voice', icon: <Mic size={14} />, color: 'bg-info-500', clips: [{ start: 2, end: 8, label: 'Narrator 01' }, { start: 15, end: 22, label: 'Narrator 02' }] },
  ];

  return (
    <StageBase
      stageId="assembly"
      stageNumber="07"
      title="Final Assembly"
      description="The final stage where everything comes together on the timeline."
      onRun={() => setStageStatus('assembly', 'COMPLETED')}
      providers={[{ label: 'DirectorByte Engine v2', value: 'engine' }]}
      models={[{ label: 'Standard Export', value: 'std' }]}
    >
      <div className="space-y-6">
        {/* Preview Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Card className={styles.previewCard} noPadding>
              <div className={styles.previewContent}>
                <div className={styles.previewPlaceholder}>
                  <Film size={48} className="text-surface-700 mb-4" />
                  <span className="text-surface-600 font-bold">PREVIEW WINDOW</span>
                </div>
              </div>
              <div className={styles.previewControls}>
                <div className="flex items-center gap-4">
                  <button className="text-surface-400 hover:text-white"><SkipBack size={20} /></button>
                  <button 
                    className={styles.mainPlayBtn}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <button className="text-surface-400 hover:text-white"><SkipForward size={20} /></button>
                </div>
                <div className="flex-1 px-8">
                  <div className="flex justify-between text-[10px] font-bold text-surface-500 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className={styles.previewProgress}>
                    <div className={styles.progressFill} style={{ width: `${(currentTime / duration) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="brand">4K</Badge>
                  <button className="text-surface-400 hover:text-white"><Layers size={20} /></button>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card header={<h3 className="font-bold">Layer Properties</h3>}>
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                  <Layers size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Select a clip on the timeline to edit its properties.</p>
                </div>
                <Button variant="outline" fullWidth iconLeft={<Plus size={18} />}>Add Media Layer</Button>
                <Button variant="primary" fullWidth iconLeft={<Save size={18} />}>Save Assembly</Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Timeline Area */}
        <Card className={styles.timelineCard} noPadding>
          <div className={styles.timelineHeader}>
            <div className={styles.trackLabels}>
              {tracks.map(t => (
                <div key={t.id} className={styles.trackLabel}>
                  {t.icon}
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.timelineRuler}>
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className={styles.rulerMark}>
                  <span>{i * 10}s</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.timelineContent}>
            <div className={styles.tracks}>
              {tracks.map(t => (
                <div key={t.id} className={styles.track}>
                  {t.clips.map((clip, i) => (
                    <div 
                      key={i} 
                      className={cn(styles.clip, t.color)}
                      style={{ 
                        left: `${(clip.start / duration) * 100}%`,
                        width: `${((clip.end - clip.start) / duration) * 100}%`
                      }}
                    >
                      {clip.label}
                    </div>
                  ))}
                </div>
              ))}
              <div 
                className={styles.playhead} 
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" size="lg" iconLeft={<Download size={18} />}>Export Video</Button>
          <Button variant="brand" size="lg" iconLeft={<Save size={18} />}>Finalize Project</Button>
        </div>
      </div>
    </StageBase>
  );
}
