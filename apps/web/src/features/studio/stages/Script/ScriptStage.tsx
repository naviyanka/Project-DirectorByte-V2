import React, { useState } from 'react';
import { Sparkles, Copy, Download, Edit2, ChevronRight } from 'lucide-react';
import { StageBase } from '../../components/StageBase/StageBase';
import { Button, Card, Select, Badge } from '../../../../design-system/components';
import { useStudioStore } from '../../../../store/studio.store';
import { projectsService } from '../../../../services/projects.service';
import { useJobPolling } from '../../../../hooks/useJobPolling';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/styles';
import styles from './ScriptStage.module.css';

export function ScriptStage() {
  const { project, stageOutputs, setStageOutput, setStageStatus } = useStudioStore();
  const scriptOutput = stageOutputs['script'];
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    idea: '',
    genre: 'Drama',
    tone: 'Dramatic',
    length: 'Short (5-10 pages)',
    language: 'English',
  });
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('gemini-pro');
  const [selectedModel, setSelectedModel] = useState('writer-v2');

  const { job: activeJob, isPolling } = useJobPolling(activeJobId, {
    onComplete: (job) => {
      setStageOutput('script', job.outputPayload);
      setStageStatus('script', 'COMPLETED');
      setActiveJobId(null);
      addToast({ title: 'Script generated!', type: 'success' });
    },
    onError: (err) => {
      setStageStatus('script', 'FAILED');
      setActiveJobId(null);
      addToast({ title: 'Generation failed', message: err, type: 'error' });
    }
  });

  const handleGenerate = async () => {
    if (!project?.id) return;
    
    try {
      setStageStatus('script', 'IN_PROGRESS');
      const job = await projectsService.generateAsset({
        projectId: project.id,
        module: 'SCRIPT',
        provider: selectedProvider,
        model: selectedModel,
        inputPayload: {
          ...formData,
          prompt: formData.idea
        }
      });
      setActiveJobId(job.id);
    } catch (err: any) {
      setStageStatus('script', 'FAILED');
      addToast({ title: 'Failed to start generation', message: err.message, type: 'error' });
    }
  };

  return (
    <StageBase
      stageId="script"
      stageNumber="01"
      title="Script / Story"
      description="Transform your idea into a professional screenplay."
      onRun={handleGenerate}
      isLoading={isPolling}
      progress={activeJob?.progress || 0}
      eta="~30s"
      providers={[
        { label: 'Google Gemini 1.5 Pro', value: 'gemini-pro' },
        { label: 'OpenAI GPT-4o', value: 'gpt-4o' },
        { label: 'Anthropic Claude 3.5 Sonnet', value: 'claude-sonnet' },
      ]}
      models={[
        { label: 'Creative Writer v2', value: 'writer-v2' },
        { label: 'Screenplay Architect', value: 'architect' },
      ]}
      onProviderChange={setSelectedProvider}
      onModelChange={setSelectedModel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card header={<h3 className="font-bold">Story Parameters</h3>}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Story Idea</label>
                <textarea 
                  className={styles.textarea} 
                  rows={8}
                  placeholder="Describe your film idea in detail..."
                  value={formData.idea}
                  onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                  disabled={isPolling}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Genre"
                  value={formData.genre}
                  onValueChange={(val) => setFormData({ ...formData, genre: val })}
                  disabled={isPolling}
                  options={[
                    { label: 'Drama', value: 'Drama' },
                    { label: 'Sci-Fi', value: 'Sci-Fi' },
                    { label: 'Action', value: 'Action' },
                  ]}
                />
                <Select 
                  label="Tone"
                  value={formData.tone}
                  onValueChange={(val) => setFormData({ ...formData, tone: val })}
                  disabled={isPolling}
                  options={[
                    { label: 'Dramatic', value: 'Dramatic' },
                    { label: 'Gritty', value: 'Gritty' },
                    { label: 'Hopeful', value: 'Hopeful' },
                  ]}
                />
              </div>

              <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                iconLeft={<Sparkles size={18} />}
                onClick={handleGenerate}
                disabled={!formData.idea || isPolling}
              >
                {isPolling ? 'Generating...' : 'Generate Screenplay'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7">
          {scriptOutput ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="success">Final Script</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" iconLeft={<Copy size={14} />}>Copy</Button>
                  <Button variant="ghost" size="sm" iconLeft={<Download size={14} />}>PDF</Button>
                  <Button variant="secondary" size="sm" iconLeft={<Edit2 size={14} />}>Edit</Button>
                </div>
              </div>
              
              <div className={styles.scriptDoc}>
                <div className={styles.scriptHeader}>
                  <h1 className="text-2xl font-bold mb-1">{scriptOutput.title}</h1>
                  <p className="text-sm opacity-60">Written by {scriptOutput.author}</p>
                </div>
                
                {scriptOutput.acts?.map((act: any, idx: number) => (
                  <div key={idx} className="space-y-6">
                    <h2 className={styles.actTitle}>{act.title}</h2>
                    {act.scenes?.map((scene: any, sIdx: number) => (
                      <div key={sIdx} className="space-y-4">
                        <div className={styles.sceneHeading}>{scene.slug}</div>
                        <p className={styles.sceneAction}>{scene.content}</p>
                        {scene.dialogue?.map((d: any, dIdx: number) => (
                          <div key={dIdx} className={styles.dialogueContainer}>
                            <div className={styles.characterName}>{d.character}</div>
                            <div className={styles.dialogueText}>{d.text}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <Button variant="brand" fullWidth iconRight={<ChevronRight size={18} />}>
                Proceed to Storyboard
              </Button>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">No script generated yet</h3>
              <p className="text-muted text-sm max-w-xs">
                Enter your story idea on the left to generate a professional screenplay using AI.
              </p>
            </Card>
          )}
        </div>
      </div>
    </StageBase>
  );
}
