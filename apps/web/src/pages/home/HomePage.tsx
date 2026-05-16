import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Film, Sparkles, AudioLines, Key, HardDrive, LayoutGrid, ArrowRight, Play, MoreVertical } from 'lucide-react';
import { Button, Card, Badge, Stat, ProgressBar, Skeleton, EmptyState, OptimizedImage } from '../../design-system/components';
import { projectsService, Project } from '../../services/projects.service';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../utils/styles';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openModal } = useUIStore();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Working late?';
  }, []);

  const { data: recentProjects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => projectsService.getRecentProjects(),
  });

  const { data: usage, isLoading: isUsageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => projectsService.getUsageStats(),
  });

  const lastActiveProject = recentProjects?.[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-900 border border-brand-400/20 flex items-center justify-center overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <span className="text-xl font-bold text-brand-400">{user?.name?.[0]}</span>}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          iconLeft={<PlusCircle size={18} />}
          onClick={() => openModal('new-project')}
        >
          New Project
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Continue Working Card */}
          {lastActiveProject && (
            <Card className={styles.continueCard}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={styles.continueThumb}>
                  <OptimizedImage 
                    src={lastActiveProject.thumbnailUrl} 
                    alt={lastActiveProject.title} 
                    aspectRatio="video"
                    fallback={<div className="flex items-center justify-center h-full bg-surface-300"><Film size={24} className="text-surface-500" /></div>}
                  />
                  <div className={styles.playOverlay}><Play size={16} fill="currentColor" /></div>
                </div>
                <div className="flex-1 w-full">
                  <Badge variant="brand" size="sm" className="mb-2">Continue Working</Badge>
                  <h3 className="text-xl font-bold">{lastActiveProject.title}</h3>
                  <p className="text-sm text-muted">Stage: {lastActiveProject.currentStage} • Last edited recently</p>
                  <div className="mt-4 flex items-center gap-4">
                    <ProgressBar value={42} size="sm" className="max-w-[200px]" />
                    <span className="text-xs text-hint">Stage 3 of 7</span>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  fullWidth={window.innerWidth < 768}
                  iconRight={<ArrowRight size={16} />} 
                  onClick={() => navigate(`/studio/${lastActiveProject.id}`)}
                >
                  Resume
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Projects */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Recent Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>View All</Button>
            </div>

            {isProjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={160} />)}
              </div>
            ) : recentProjects?.length === 0 ? (
              <EmptyState 
                icon={<Film size={48} />}
                title="No projects yet"
                description="Start your first AI film in seconds."
                action={<Button variant="primary" onClick={() => openModal('new-project')}>Create First Project</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(recentProjects) && recentProjects.map((project) => (
                  <Card key={project.id} hoverable className={styles.projectCard}>
                    <div className={styles.projectCardThumb}>
                      <OptimizedImage 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        aspectRatio="video"
                        fallback={<div className="flex items-center justify-center h-full bg-surface-300"><Film size={24} className="text-surface-500" /></div>}
                      />
                      <Badge className={styles.projectStatus} variant={project.status === 'COMPLETED' ? 'success' : 'brand'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold truncate">{project.title}</h3>
                        <button className="text-hint hover:text-primary"><MoreVertical size={16} /></button>
                      </div>
                      <p className="text-xs text-muted mb-4">{project.currentStage}</p>
                      <div className="flex justify-between items-center text-[10px] text-hint uppercase font-bold tracking-wider">
                        <span>Last edit: recently</span>
                        <span>{Math.round(parseInt(project.storageSizeBytes || '0') / 1024 / 1024)} MB</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Content (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Usage Stats */}
          <Card header={<h3 className="font-bold">Usage Summary</h3>}>
            <div className="space-y-6">
              {isUsageLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} height={60} />)
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-secondary">AI Credits</span>
                      <span className="text-primary font-bold">{usage?.credits.used} / {usage?.credits.total}</span>
                    </div>
                    <ProgressBar value={(usage?.credits.used || 0) / (usage?.credits.total || 1) * 100} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-secondary">Cloud Storage</span>
                      <span className="text-primary font-bold">
                        {Math.round(parseInt(usage?.storage.used || '0') / 1024 / 1024 / 1024)} / {Math.round(parseInt(usage?.storage.total || '0') / 1024 / 1024 / 1024)} GB
                      </span>
                    </div>
                    <ProgressBar value={(parseInt(usage?.storage.used || '0')) / (parseInt(usage?.storage.total || '1')) * 100} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-secondary">Monthly Exports</span>
                      <span className="text-primary font-bold">{usage?.exports.used} / {usage?.exports.total}</span>
                    </div>
                    <ProgressBar value={(usage?.exports.used || 0) / (usage?.exports.total || 1) * 100} size="sm" />
                  </div>
                </>
              )}
              <Button variant="secondary" fullWidth size="sm">Manage Plan</Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card header={<h3 className="font-bold">Quick Actions</h3>}>
            <div className="grid grid-cols-1 gap-2">
              <button className={styles.actionBtn}>
                <LayoutGrid size={18} className="text-brand-400" />
                <span>New Project</span>
              </button>
              <button className={styles.actionBtn}>
                <Sparkles size={18} className="text-brand-400" />
                <span>Script Generator</span>
              </button>
              <button className={styles.actionBtn}>
                <AudioLines size={18} className="text-brand-400" />
                <span>Audio Engine</span>
              </button>
              <button className={styles.actionBtn}>
                <Key size={18} className="text-brand-400" />
                <span>API Keys</span>
              </button>
              <button className={styles.actionBtn}>
                <HardDrive size={18} className="text-brand-400" />
                <span>View Storage</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
