import React, { useState } from 'react';
import { Sparkles, Music, Play, Pause, Download, RotateCcw, ChevronRight, Upload } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Badge, ProgressBar, Select, Toggle } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { cn } from '../../../../utils/styles';
import styles from './AudioStage.module.css';

export function AudioStage() {
  const { stageOutputs, setStageOutput, setStageStatus } = useStudioStore();
  const audioData = stageOutputs['audio'];
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);
    setStageStatus('audio', 'IN_PROGRESS');
    
    for (let i = 20; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 400));
      setProgress(i);
    }
    
    setStageOutput('audio', {
      title: "Cinematic Orchestral Theme",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder audio
      duration: "1:45",
      genre: "Cinematic",
      mood: "Epic",
    });
    
    setStageStatus('audio', 'COMPLETED');
    setIsGenerating(false);
  };

  return (
    <StageBase
      stageId="audio"
      stageNumber="06"
      title="Audio / Music Generation"
      description="Create the perfect soundscape and score for your film."
      onRun={handleGenerate}
      isLoading={isGenerating}
      progress={progress}
      eta="~45s"
      providers={[
        { label: 'Suno AI v3.5', value: 'suno' },
        { label: 'Udio (Beta)', value: 'udio' },
        { label: 'Mubert AI', value: 'mubert' },
      ]}
      models={[
        { label: 'Orchestral Score', value: 'orchestral' },
        { label: 'Ambient Soundscape', value: 'ambient' },
        { label: 'Modern Electronic', value: 'electronic' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card header={<h3 className="font-bold">Music Parameters</h3>}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Musical Style / Prompt</label>
                <textarea 
                  className={styles.textarea} 
                  rows={4}
                  placeholder="e.g. 'Cinematic orchestral score with deep brass and swelling strings, building tension...'"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Genre"
                  options={[
                    { label: 'Cinematic', value: 'cinematic' },
                    { label: 'Electronic', value: 'electronic' },
                    { label: 'Ambient', value: 'ambient' },
                  ]}
                />
                <Select 
                  label="Mood"
                  options={[
                    { label: 'Epic', value: 'epic' },
                    { label: 'Mysterious', value: 'mysterious' },
                    { label: 'Hopeful', value: 'hopeful' },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Music size={18} className="text-brand-400" />
                  <span className="text-sm font-medium">Instrumental Only</span>
                </div>
                <Toggle checked={true} />
              </div>

              <div className={styles.divider}>
                <span>OR</span>
              </div>

              <Button variant="outline" fullWidth iconLeft={<Upload size={18} />}>
                Upload Custom Track
              </Button>

              <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                iconLeft={<Sparkles size={18} />}
                onClick={handleGenerate}
                isLoading={isGenerating}
              >
                Generate Score
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7">
          {audioData ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Badge variant="success">Final Audio</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" iconLeft={<Download size={14} />}>Download</Button>
                  <Button variant="secondary" size="sm" iconLeft={<RotateCcw size={14} />}>Regenerate</Button>
                </div>
              </div>

              <Card className={styles.audioCard}>
                <div className="flex items-center gap-6">
                  <button 
                    className={styles.playBtn}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-hint">
                      <span>{audioData.title}</span>
                      <span>{audioData.duration}</span>
                    </div>
                    <div className={styles.waveform}>
                      {/* Fake waveform bars */}
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(styles.waveBar, isPlaying && styles.animating)} 
                          style={{ 
                            height: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.05}s`
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-100 rounded-lg border border-surface-200">
                  <span className="text-xs font-bold uppercase text-hint block mb-1">Genre</span>
                  <span className="font-medium">{audioData.genre}</span>
                </div>
                <div className="p-4 bg-surface-100 rounded-lg border border-surface-200">
                  <span className="text-xs font-bold uppercase text-hint block mb-1">Mood</span>
                  <span className="font-medium">{audioData.mood}</span>
                </div>
              </div>

              <Button variant="brand" fullWidth size="lg" iconRight={<ChevronRight size={18} />}>
                Proceed to Assembly
              </Button>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
                <Music size={32} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">No audio generated yet</h3>
              <p className="text-muted text-sm max-w-xs">
                Describe the style of music you want or upload your own background track.
              </p>
            </Card>
          )}
        </div>
      </div>
    </StageBase>
  );
}
