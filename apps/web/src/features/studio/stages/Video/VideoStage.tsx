import React, { useState } from 'react';
import { Sparkles, Film, Download, RotateCcw, ChevronRight, Sliders } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Badge, ProgressBar, Select } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { projectsService } from '../../../../services/projects.service';
import { useJobPolling } from '../../../../hooks/useJobPolling';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/styles';
import styles from './VideoStage.module.css';

export function VideoStage() {
  const { project, stageOutputs, setStageOutput, setStageStatus } = useStudioStore();
  const videoData = stageOutputs['video'];
  const keyframeData = stageOutputs['keyframes'];
  const { addToast } = useToast();
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('runway');
  const [selectedModel, setSelectedModel] = useState('motion-v2');
  const [formData, setFormData] = useState({
    intensity: 'standard',
    cameraMovement: 'static',
    prompt: ''
  });

  const { job: activeJob, isPolling } = useJobPolling(activeJobId, {
    onComplete: (job) => {
      setStageOutput('video', job.outputPayload);
      setStageStatus('video', 'COMPLETED');
      setActiveJobId(null);
      addToast({ title: 'Video generated!', type: 'success' });
    },
    onError: (err) => {
      setStageStatus('video', 'FAILED');
      setActiveJobId(null);
      addToast({ title: 'Video generation failed', message: err, type: 'error' });
    }
  });

  const handleGenerate = async () => {
    if (!project?.id) return;
    if (!keyframeData || keyframeData.length === 0) {
      addToast({ title: 'Keyframes required', message: 'Please generate keyframes first.', type: 'warning' });
      return;
    }
    
    try {
      setStageStatus('video', 'IN_PROGRESS');
      const job = await projectsService.generateAsset({
        projectId: project.id,
        module: 'VIDEO_GEN',
        provider: selectedProvider,
        model: selectedModel,
        inputPayload: {
          ...formData,
          keyframes: keyframeData
        }
      });
      setActiveJobId(job.id);
    } catch (err: any) {
      setStageStatus('video', 'FAILED');
      addToast({ title: 'Failed to start video generation', message: err.message, type: 'error' });
    }
  };

  return (
    <StageBase
      stageId="video"
      stageNumber="05"
      title="Video Generation"
      description="Bring your keyframes to life with high-end AI motion."
      onRun={handleGenerate}
      isLoading={isPolling}
      progress={activeJob?.progress || 0}
      eta="~2m"
      providers={[
        { label: 'Runway Gen-3 Alpha', value: 'runway' },
        { label: 'Luma Dream Machine', value: 'luma' },
        { label: 'Kling AI (Pro)', value: 'kling' },
      ]}
      models={[
        { label: 'Cinematic Motion v2', value: 'motion-v2' },
        { label: 'Subtle Realism', value: 'realism' },
      ]}
      onProviderChange={setSelectedProvider}
      onModelChange={setSelectedModel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card header={<h3 className="font-bold">Motion Settings</h3>}>
            <div className="space-y-6">
              <div className="space-y-4">
                <Select 
                  label="Motion Intensity"
                  value={formData.intensity}
                  onValueChange={(val) => setFormData({ ...formData, intensity: val })}
                  disabled={isPolling}
                  options={[
                    { label: 'Subtle (Low)', value: 'subtle' },
                    { label: 'Cinematic (Standard)', value: 'standard' },
                    { label: 'Dynamic (High)', value: 'dynamic' },
                  ]}
                />
                <Select 
                  label="Camera Movement"
                  value={formData.cameraMovement}
                  onValueChange={(val) => setFormData({ ...formData, cameraMovement: val })}
                  disabled={isPolling}
                  options={[
                    { label: 'Static', value: 'static' },
                    { label: 'Zoom In', value: 'zoom-in' },
                    { label: 'Pan Right', value: 'pan-right' },
                    { label: 'Orbit', value: 'orbit' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motion Prompt (Optional)</label>
                <textarea 
                  className={styles.textarea} 
                  rows={4}
                  placeholder="Describe the movement... e.g. 'Camera orbits the artifact as dust swirls around it'"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  disabled={isPolling}
                />
              </div>

              <Button 
                variant="primary" 
                fullWidth 
                iconLeft={<Sparkles size={18} />}
                onClick={handleGenerate}
                disabled={isPolling}
              >
                {isPolling ? 'Generating...' : 'Generate Video'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-8">
          {isPolling ? (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <div className={styles.jobStatus}>
                <div className={styles.spinnerLg} />
                <h3 className="text-xl font-bold mt-6 mb-2">
                  {activeJob?.status === 'QUEUED' ? 'Waiting for GPU...' : 'Generating Cinematic Video...'}
                </h3>
                <p className="text-muted text-sm mb-8">This usually takes about 2 minutes for 4K output.</p>
                <div className="w-full max-w-md mx-auto">
                  <ProgressBar value={activeJob?.progress || 0} size="lg" variant="brand" animated showValue />
                </div>
              </div>
            </Card>
          ) : videoData ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="success">Final Rendering</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" iconLeft={<Download size={14} />}>Download</Button>
                  <Button variant="secondary" size="sm" iconLeft={<RotateCcw size={14} />}>Regenerate</Button>
                </div>
              </div>

              <div className={styles.videoPlayer}>
                <video src={videoData.url} controls className="w-full h-full rounded-lg" poster={videoData.thumbnail} />
                <div className={styles.videoMeta}>
                  <span>{videoData.duration}</span>
                  <span>•</span>
                  <span>{videoData.resolution}</span>
                  <span>•</span>
                  <span>{videoData.fps} FPS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" iconLeft={<Sliders size={18} />}>Fine-tune Motion</Button>
                <Button variant="brand" iconRight={<ChevronRight size={18} />}>Proceed to Audio</Button>
              </div>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
                <Film size={32} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">No video generated yet</h3>
              <p className="text-muted text-sm max-w-xs">
                Configure your motion settings and click generate to create your cinematic video.
              </p>
            </Card>
          )}
        </div>
      </div>
    </StageBase>
  );
}
