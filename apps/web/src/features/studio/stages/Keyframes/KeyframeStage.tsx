import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight, RotateCcw, Download } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Select } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { projectsService } from '../../../../services/projects.service';
import { useJobPolling } from '../../../../hooks/useJobPolling';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/styles';
import styles from './KeyframeStage.module.css';

export function KeyframeStage() {
  const { project, stageOutputs, setStageOutput, setStageStatus } = useStudioStore();
  const keyframeData = stageOutputs['keyframes'] || [];
  const storyboardData = stageOutputs['storyboard'];
  const { addToast } = useToast();
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('flux');
  const [selectedModel, setSelectedModel] = useState('photo');

  const { job: activeJob, isPolling } = useJobPolling(activeJobId, {
    onComplete: (job) => {
      setStageOutput('keyframes', job.outputPayload);
      setStageStatus('keyframes', 'COMPLETED');
      setActiveJobId(null);
      addToast({ title: 'Keyframes generated!', type: 'success' });
    },
    onError: (err) => {
      setStageStatus('keyframes', 'FAILED');
      setActiveJobId(null);
      addToast({ title: 'Keyframe generation failed', message: err, type: 'error' });
    }
  });

  const handleGenerate = async () => {
    if (!project?.id) return;
    if (!storyboardData || storyboardData.length === 0) {
      addToast({ title: 'Storyboard required', message: 'Please generate a storyboard first.', type: 'warning' });
      return;
    }
    
    try {
      setStageStatus('keyframes', 'IN_PROGRESS');
      const job = await projectsService.generateAsset({
        projectId: project.id,
        module: 'IMAGE_GEN', // Keyframes are high-res images
        provider: selectedProvider,
        model: selectedModel,
        inputPayload: {
          storyboard: storyboardData
        }
      });
      setActiveJobId(job.id);
    } catch (err: any) {
      setStageStatus('keyframes', 'FAILED');
      addToast({ title: 'Failed to start keyframe generation', message: err.message, type: 'error' });
    }
  };

  return (
    <StageBase
      stageId="keyframes"
      stageNumber="03"
      title="Keyframe Generation"
      description="Create high-fidelity cinematic keyframes for your film."
      onRun={handleGenerate}
      isLoading={isPolling}
      progress={activeJob?.progress || 0}
      eta="~1m"
      providers={[
        { label: 'Flux.1 Pro', value: 'flux' },
        { label: 'Midjourney v6.1', value: 'midjourney' },
        { label: 'Stable Diffusion 3', value: 'sd3' },
      ]}
      models={[
        { label: 'Photorealistic Cinematic', value: 'photo' },
        { label: 'Epic Concept Art', value: 'concept' },
      ]}
      onProviderChange={setSelectedProvider}
      onModelChange={setSelectedModel}
    >
      <div className="space-y-8">
        {keyframeData.length > 0 ? (
          <div className="space-y-12">
            {keyframeData.map((kf: any) => (
              <div key={kf.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-lg font-bold">{kf.title}</h3>
                    <p className="text-sm text-muted">Primary generation for Scene {kf.scene || '01'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" iconLeft={<RotateCcw size={14} />}>Regenerate</Button>
                    <Button variant="ghost" size="sm" iconLeft={<Download size={14} />}>Download</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8">
                    <div className={styles.mainImage}>
                      <img src={kf.imageUrl} alt={kf.title} />
                      <div className={styles.selectionBadge}>
                        <Check size={14} />
                        <span>Selected</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-hint">Variations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {kf.variations?.map((v: string, i: number) => (
                        <div key={i} className={styles.variationThumb}>
                          <img src={v} alt={`Variation ${i + 1}`} />
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-surface-200">
                      <Select 
                        label="Aspect Ratio"
                        options={[
                          { label: '16:9 Cinematic', value: '16:9' },
                          { label: '2.35:1 Anamorphic', value: '2.35:1' },
                          { label: '4:3 Academy', value: '4:3' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-center pt-8">
              <Button variant="brand" size="lg" iconRight={<ChevronRight size={18} />}>
                Proceed to Video Generation
              </Button>
            </div>
          </div>
        ) : (
          <Card className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">No keyframes generated</h3>
            <p className="text-muted text-sm max-w-sm">
              Convert your storyboard frames into high-fidelity cinematic keyframes. 
              These will serve as the source for your video generation.
            </p>
            <Button variant="primary" className="mt-6" onClick={handleGenerate} disabled={isPolling}>
              {isPolling ? 'Generating...' : 'Generate Keyframes'}
            </Button>
          </Card>
        )}
      </div>
    </StageBase>
  );
}
