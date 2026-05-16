import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Sparkles, Layout, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Modal, Button, Input, Select, Checkbox } from '../../design-system/components';
import { projectsService } from '../../services/projects.service';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../utils/styles';
import styles from './NewProjectModal.module.css';

export function NewProjectModal() {
  const navigate = useNavigate();
  const { activeModal, closeModal, addToast } = useUIStore();
  const isOpen = activeModal === 'new-project';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: 'Drama',
    style: 'Cinematic',
    duration: 'Short (< 1 min)',
    pipeline: ['script', 'storyboard', 'images', 'video', 'audio', 'assembly'],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const project = await projectsService.createProject(formData);
      addToast({
        title: 'Project created!',
        description: `Successfully created "${project.title}"`,
        variant: 'success',
      });
      closeModal();
      navigate(`/studio/${project.id}`);
    } catch (err) {
      addToast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePipeline = (stage: string) => {
    setFormData(prev => ({
      ...prev,
      pipeline: prev.pipeline.includes(stage)
        ? prev.pipeline.filter(s => s !== stage)
        : [...prev.pipeline, stage]
    }));
  };

  return (
    <Modal 
      open={isOpen} 
      onOpenChange={(open) => !open && closeModal()} 
      title={step === 1 ? 'New Project' : step === 2 ? 'Film Settings' : 'Studio Pipeline'}
      size="md"
    >
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepper}>
          {[1, 2, 3].map(i => (
            <div key={i} className={cn(styles.step, i <= step && styles.stepActive)}>
              {i < step ? <Check size={12} /> : i}
            </div>
          ))}
          <div className={styles.stepProgress} style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <Input 
              label="Project Title" 
              placeholder="The Neon Awakening" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-secondary">Description (Optional)</label>
              <textarea 
                className={styles.textarea} 
                rows={3} 
                placeholder="A high-concept sci-fi short about..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="text-[10px] text-right text-hint">{formData.description.length}/500</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Genre"
                value={formData.genre}
                onValueChange={(val) => setFormData({ ...formData, genre: val })}
                options={[
                  { label: 'Drama', value: 'Drama' },
                  { label: 'Sci-Fi', value: 'Sci-Fi' },
                  { label: 'Action', value: 'Action' },
                  { label: 'Horror', value: 'Horror' },
                  { label: 'Comedy', value: 'Comedy' },
                ]}
              />
              <Select 
                label="Visual Style"
                value={formData.style}
                onValueChange={(val) => setFormData({ ...formData, style: val })}
                options={[
                  { label: 'Cinematic', value: 'Cinematic' },
                  { label: 'Animated', value: 'Animated' },
                  { label: 'Realistic', value: 'Realistic' },
                  { label: 'Vintage', value: 'Vintage' },
                ]}
              />
            </div>
            <Select 
              label="Target Duration"
              value={formData.duration}
              onValueChange={(val) => setFormData({ ...formData, duration: val })}
              options={[
                { label: 'Short (< 1 min)', value: 'Short (< 1 min)' },
                { label: 'Medium (1-5 min)', value: 'Medium (1-5 min)' },
                { label: 'Long (5-15 min)', value: 'Long (5-15 min)' },
              ]}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-sm text-muted">Which stages do you want to include in this project?</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'script', label: 'Script / Story' },
                { id: 'storyboard', label: 'Storyboard / Keyframes' },
                { id: 'images', label: 'Image Generation' },
                { id: 'video', label: 'Video Generation' },
                { id: 'audio', label: 'Audio / Music' },
                { id: 'assembly', label: 'Final Assembly' },
              ].map(stage => (
                <div key={stage.id} className={styles.pipelineItem}>
                  <Checkbox 
                    id={stage.id}
                    checked={formData.pipeline.includes(stage.id)}
                    onCheckedChange={() => togglePipeline(stage.id)}
                    label={stage.label}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-8">
          <Button variant="ghost" onClick={step === 1 ? closeModal : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            variant="primary" 
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            disabled={step === 1 && !formData.title}
            isLoading={isLoading}
            iconRight={step === 3 ? <Check size={18} /> : <ChevronRight size={18} />}
          >
            {step === 3 ? 'Create Project' : 'Next Step'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
