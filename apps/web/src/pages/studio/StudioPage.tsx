import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout } from '../../layouts/StudioLayout/StudioLayout';
import { ScriptStage } from '../../features/studio/stages/Script/ScriptStage';
import { StoryboardStage } from '../../features/studio/stages/Storyboard/StoryboardStage';
import { KeyframeStage } from '../../features/studio/stages/Keyframes/KeyframeStage';
import { VideoStage } from '../../features/studio/stages/Video/VideoStage';
import { AudioStage } from '../../features/studio/stages/Audio/AudioStage';
import { AssemblyStage } from '../../features/studio/stages/Assembly/AssemblyStage';
import { projectsService } from '../../services/projects.service';
import { useStudioStore } from '../../store/studio.store';
import { Skeleton } from '../../design-system/components';
import { useToast } from '../../hooks/useToast';

export function StudioPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, setProject, activeStageId, stageOutputs } = useStudioStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const saveTimerRef = useRef<any>(null);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => projectsService.updateProject(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      // We don't toast on every auto-save to avoid noise
    },
    onError: (err: any) => {
      addToast({ title: 'Auto-save failed', message: err.message, type: 'error' });
    }
  });

  useEffect(() => {
    if (projectData) {
      setProject(projectData as any);
      // Initialize stage outputs from project data if they exist
      if (projectData.pipelineConfig?.stageOutputs) {
        Object.entries(projectData.pipelineConfig.stageOutputs).forEach(([stageId, output]) => {
          useStudioStore.getState().setStageOutput(stageId, output);
        });
      }
    }
  }, [projectData, setProject]);

  // Debounced Auto-save
  useEffect(() => {
    if (!project || !stageOutputs || Object.keys(stageOutputs).length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const currentProject = useStudioStore.getState().project;
      saveMutation.mutate({
        pipelineConfig: {
          ...currentProject?.pipelineConfig,
          stageOutputs
        }
      });
    }, 5000); // 5s debounce

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [stageOutputs]);

  if (isLoading) {
    return (
      <StudioLayout>
        <div className="space-y-8 animate-pulse">
          <Skeleton height={200} />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4"><Skeleton height={400} /></div>
            <div className="col-span-8"><Skeleton height={400} /></div>
          </div>
        </div>
      </StudioLayout>
    );
  }

  const renderStage = () => {
    switch (activeStageId) {
      case 'script':
        return <ScriptStage />;
      case 'storyboard':
        return <StoryboardStage />;
      case 'keyframes':
        return <KeyframeStage />;
      case 'video':
        return <VideoStage />;
      case 'audio':
        return <AudioStage />;
      case 'assembly':
        return <AssemblyStage />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <h2 className="text-xl font-bold mb-2">Stage coming soon!</h2>
            <p className="text-muted">We are currently implementing the {activeStageId} stage.</p>
          </div>
        );
    }
  };

  return (
    <StudioLayout>
      {renderStage()}
    </StudioLayout>
  );
}
