import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, List, Grid as GridIcon, MoreVertical, Film, Download, Trash2, Archive, Copy, Play } from 'lucide-react';
import { projectsService, Project } from '../../services/projects.service';
import { Button, Input, Card, Badge, Select, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, OptimizedImage, Skeleton } from '../../design-system/components';
import { cn } from '../../utils/styles';
import styles from './ProjectsPage.module.css';

export function ProjectsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', { status, search, sort }],
    queryFn: () => projectsService.getProjects({ status, search, sort }),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted">Manage and organize your cinematic creations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={styles.viewToggle}>
            <button 
              className={cn(styles.toggleBtn, view === 'grid' && styles.active)} 
              onClick={() => setView('grid')}
            >
              <GridIcon size={18} />
            </button>
            <button 
              className={cn(styles.toggleBtn, view === 'list' && styles.active)} 
              onClick={() => setView('list')}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="primary">New Project</Button>
        </div>
      </div>

      <Card className={styles.filterBar}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="flex gap-4">
            <Select 
              value={status} 
              onValueChange={setStatus}
              options={[
                { label: 'All Status', value: 'ALL' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Archived', value: 'ARCHIVED' },
              ]}
            />
            <Select 
              value={sort} 
              onValueChange={setSort}
              options={[
                { label: 'Newest First', value: 'newest' },
                { label: 'Oldest First', value: 'oldest' },
                { label: 'Alphabetical (A-Z)', value: 'az' },
                { label: 'Alphabetical (Z-A)', value: 'za' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Projects Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton height={140} variant="rectangular" />
              <div className="p-4 space-y-2">
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={14} />
                <div className="flex justify-between pt-2">
                  <Skeleton width="30%" height={10} />
                  <Skeleton width="20%" height={10} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects?.map((project) => (
            <ProjectGridCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Storage</th>
                  <th>Last Edited</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects?.map((project) => (
                  <ProjectListRow key={project.id} project={project} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ProjectGridCard({ project }: { project: Project }) {
  return (
    <Card hoverable className={styles.gridCard}>
      <div className={styles.gridCardThumb}>
        <OptimizedImage 
          src={project.thumbnailUrl} 
          alt={project.title} 
          aspectRatio="video"
          fallback={<div className="flex items-center justify-center h-full bg-surface-300"><Film size={32} className="text-surface-500" /></div>}
        />
        <Badge className={styles.statusBadge} variant={project.status === 'COMPLETED' ? 'success' : 'brand'}>
          {project.status}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold truncate">{project.title}</h3>
          <ProjectActions project={project} />
        </div>
        <p className="text-xs text-muted mb-4">{project.currentStage}</p>
        <div className="flex justify-between items-center text-[10px] text-hint uppercase font-bold tracking-wider">
          <span>{new Date(project.lastEditedAt).toLocaleDateString()}</span>
          <span>{Math.round(parseInt(project.storageSizeBytes || '0') / 1024 / 1024)} MB</span>
        </div>
      </div>
    </Card>
  );
}

function ProjectListRow({ project }: { project: Project }) {
  return (
    <tr className={styles.row}>
      <td>
        <div className="flex items-center gap-3">
          <div className={styles.listThumb}>
            <OptimizedImage 
              src={project.thumbnailUrl} 
              alt="" 
              aspectRatio="square"
              fallback={<Film size={14} className="text-brand-400" />}
            />
          </div>
          <span className="font-bold">{project.title}</span>
        </div>
      </td>
      <td>
        <Badge variant={project.status === 'COMPLETED' ? 'success' : 'brand'} size="sm">
          {project.status}
        </Badge>
      </td>
      <td><span className="text-sm text-secondary">{project.currentStage}</span></td>
      <td><span className="text-sm text-secondary">{Math.round(parseInt(project.storageSizeBytes || '0') / 1024 / 1024)} MB</span></td>
      <td><span className="text-sm text-secondary">{new Date(project.lastEditedAt).toLocaleDateString()}</span></td>
      <td className="text-right">
        <ProjectActions project={project} />
      </td>
    </tr>
  );
}

function ProjectActions({ project }: { project: Project }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-hint hover:text-primary transition-colors">
          <MoreVertical size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem iconLeft={<Play size={14} />}>Open Project</DropdownMenuItem>
        <DropdownMenuItem iconLeft={<Copy size={14} />}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem iconLeft={<Download size={14} />}>Export</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem iconLeft={<Archive size={14} />}>Archive</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" iconLeft={<Trash2 size={14} />}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
