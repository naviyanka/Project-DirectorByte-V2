import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'FAILED' | 'GENERATING';
  currentStage: string;
  lastEditedAt: string;
  pipeline?: string[];
  pipelineConfig?: any;
}

export interface GenerationJob {
  id: string;
  type: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  error?: string;
}

interface StudioState {
  // Project
  project: Project | null;
  projectId: string | null;
  
  // Pipeline
  activeStageId: string;
  stageStatuses: Record<string, StageStatus>;
  stageOutputs: Record<string, any>;
  
  // Settings
  selectedProviders: Record<string, string>;
  selectedModels: Record<string, string>;
  stageSettings: Record<string, Record<string, any>>;
  
  // UI State
  isSettingsOpen: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  
  // Active Jobs
  activeJobs: Record<string, GenerationJob>;
  
  // Actions
  setProject: (project: Project) => void;
  setActiveStage: (stageId: string) => void;
  setStageStatus: (stageId: string, status: StageStatus) => void;
  setStageOutput: (stageId: string, output: any) => void;
  setProvider: (stageId: string, providerId: string) => void;
  setModel: (stageId: string, modelId: string) => void;
  updateStageSettings: (stageId: string, settings: Record<string, any>) => void;
  toggleSettings: () => void;
  setSaving: (isSaving: boolean) => void;
  markSaved: () => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  addJob: (job: GenerationJob) => void;
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void;
  removeJob: (jobId: string) => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      project: null,
      projectId: null,
      activeStageId: 'script',
      stageStatuses: {},
      stageOutputs: {},
      selectedProviders: {},
      selectedModels: {},
      stageSettings: {},
      isSettingsOpen: false,
      isSaving: false,
      lastSavedAt: null,
      hasUnsavedChanges: false,
      activeJobs: {},

      setProject: (project) => set({ project, projectId: project.id }),
      setActiveStage: (activeStageId) => set({ activeStageId }),
      setStageStatus: (stageId, status) => 
        set((state) => ({ stageStatuses: { ...state.stageStatuses, [stageId]: status } })),
      setStageOutput: (stageId, output) => 
        set((state) => ({ 
          stageOutputs: { ...state.stageOutputs, [stageId]: output },
          hasUnsavedChanges: true 
        })),
      setProvider: (stageId, providerId) => 
        set((state) => ({ 
          selectedProviders: { ...state.selectedProviders, [stageId]: providerId },
          hasUnsavedChanges: true 
        })),
      setModel: (stageId, modelId) => 
        set((state) => ({ 
          selectedModels: { ...state.selectedModels, [stageId]: modelId },
          hasUnsavedChanges: true 
        })),
      updateStageSettings: (stageId, settings) => 
        set((state) => ({ 
          stageSettings: { ...state.stageSettings, [stageId]: { ...state.stageSettings[stageId], ...settings } },
          hasUnsavedChanges: true 
        })),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setSaving: (isSaving) => set({ isSaving }),
      markSaved: () => set({ isSaving: false, lastSavedAt: new Date().toISOString(), hasUnsavedChanges: false }),
      setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
      addJob: (job) => set((state) => ({ activeJobs: { ...state.activeJobs, [job.id]: job } })),
      updateJob: (jobId, updates) => set((state) => ({
        activeJobs: { ...state.activeJobs, [jobId]: { ...state.activeJobs[jobId], ...updates } }
      })),
      removeJob: (jobId) => set((state) => {
        const { [jobId]: _, ...rest } = state.activeJobs;
        return { activeJobs: rest };
      }),
    }),
    {
      name: 'directorbyte-studio',
      partialize: (state) => ({ 
        stageStatuses: state.stageStatuses,
        stageOutputs: state.stageOutputs,
        selectedProviders: state.selectedProviders,
        selectedModels: state.selectedModels,
        stageSettings: state.stageSettings,
      }),
    }
  )
);
