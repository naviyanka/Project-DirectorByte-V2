import React, { useState } from 'react';
import { Sparkles, LayoutGrid, Plus, RotateCcw, Edit2, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Badge, Stat } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { projectsService } from '../../../../services/projects.service';
import { useJobPolling } from '../../../../hooks/useJobPolling';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/styles';
import styles from './StoryboardStage.module.css';

export function StoryboardStage() {
  const { project, stageOutputs, setStageOutput, setStageStatus } = useStudioStore();
  const storyboardData = stageOutputs['storyboard'] || [];
  const scriptData = stageOutputs['script'];
  const { addToast } = useToast();
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('midjourney');
  const [selectedModel, setSelectedModel] = useState('cinema');

  const { job: activeJob, isPolling } = useJobPolling(activeJobId, {
    onComplete: (job) => {
      setStageOutput('storyboard', job.outputPayload);
      setStageStatus('storyboard', 'COMPLETED');
      setActiveJobId(null);
      addToast({ title: 'Storyboard generated!', type: 'success' });
    },
    onError: (err) => {
      setStageStatus('storyboard', 'FAILED');
      setActiveJobId(null);
      addToast({ title: 'Storyboard generation failed', message: err, type: 'error' });
    }
  });

  const handleGenerate = async () => {
    if (!project?.id) return;
    if (!scriptData) {
      addToast({ title: 'Script required', message: 'Please generate a script first.', type: 'warning' });
      return;
    }
    
    try {
      setStageStatus('storyboard', 'IN_PROGRESS');
      const job = await projectsService.generateAsset({
        projectId: project.id,
        module: 'STORYBOARD',
        provider: selectedProvider,
        model: selectedModel,
        inputPayload: {
          script: scriptData
        }
      });
      setActiveJobId(job.id);
    } catch (err: any) {
      setStageStatus('storyboard', 'FAILED');
      addToast({ title: 'Failed to start storyboard generation', message: err.message, type: 'error' });
    }
  };

  return (
    <StageBase
      stageId="storyboard"
      stageNumber="02"
      title="Storyboard / Visual Planning"
      description="Design the visual flow and key moments of your story."
      onRun={handleGenerate}
      isLoading={isPolling}
      progress={activeJob?.progress || 0}
      eta="~45s"
      providers={[
        { label: 'Midjourney v6', value: 'midjourney' },
        { label: 'Stable Diffusion XL', value: 'sdxl' },
        { label: 'DALL-E 3', value: 'dalle-3' },
      ]}
      models={[
        { label: 'Cinematic Concept Art', value: 'cinema' },
        { label: 'Storybook Sketch', value: 'sketch' },
      ]}
      onProviderChange={setSelectedProvider}
      onModelChange={setSelectedModel}
    >
      <div className="space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Total Frames" value={storyboardData.length} icon={<LayoutGrid size={18} />} />
          <Stat label="Estimated Budget" value="15 Credits" icon={<Sparkles size={18} />} />
        </div>

        {/* Frames Grid */}
        {storyboardData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyboardData.map((frame: any) => (
              <Card key={frame.id} className={styles.frameCard} noPadding>
                <div className={styles.frameThumb}>
                  <img src={frame.imageUrl} alt={frame.title} />
                  <div className={styles.frameOverlay}>
                    <Button variant="ghost" size="sm" className="bg-surface-100/20 backdrop-blur-sm"><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="sm" className="bg-surface-100/20 backdrop-blur-sm"><RotateCcw size={14} /></Button>
                  </div>
                  <Badge className={styles.frameBadge} variant="brand">Scene {frame.scene}</Badge>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">{frame.title}</h3>
                  <p className="text-xs text-muted line-clamp-2">{frame.prompt}</p>
                </div>
              </Card>
            ))}
            <button className={styles.addCard} onClick={() => {}}>
              <Plus size={24} />
              <span>Add Scene Frame</span>
            </button>
          </div>
        ) : (
          <Card className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
              <ImageIcon size={32} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Storyboard is empty</h3>
            <p className="text-muted text-sm max-w-sm">
              Generate visual frames based on your script. AI will automatically create prompts for each scene.
            </p>
            <Button variant="primary" className="mt-6" onClick={handleGenerate} disabled={isPolling}>
              {isPolling ? 'Generating...' : 'Generate Storyboard'}
            </Button>
          </Card>
        )}

        {storyboardData.length > 0 && (
          <div className="flex justify-center pt-8">
            <Button variant="brand" size="lg" iconRight={<ChevronRight size={18} />}>
              Proceed to Keyframe Generation
            </Button>
          </div>
        )}
      </div>
    </StageBase>
  );
}
