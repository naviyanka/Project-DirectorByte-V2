import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cloud, CloudOff, Play, Download, MoreVertical, Edit2, Check, X } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Input } from '../../design-system/components';
import { useStudioStore } from '../../store/studio.store';
import { cn } from '../../utils/styles';
import styles from './StudioTopbar.module.css';

export function StudioTopbar() {
  const navigate = useNavigate();
  const { project, isSaving, lastSavedAt, hasUnsavedChanges, setProject, toggleSettings } = useStudioStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(project?.title || '');

  useEffect(() => {
    if (project?.title) setTempTitle(project.title);
  }, [project?.title]);

  const handleSaveTitle = () => {
    if (tempTitle.trim() && project) {
      setProject({ ...project, title: tempTitle });
      setIsEditingTitle(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to exit?')) {
        navigate('/home');
      }
    } else {
      navigate('/home');
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={handleBack}>
          <ChevronLeft size={20} />
          <span>Home</span>
        </button>
        
        <div className={styles.divider} />
        
        <div className={styles.titleContainer}>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input 
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                size="sm"
                className={styles.titleInput}
              />
              <button className={styles.actionIcon} onClick={handleSaveTitle}><Check size={16} /></button>
              <button className={styles.actionIcon} onClick={() => setIsEditingTitle(false)}><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className={styles.title}>{project?.title || 'Untitled Project'}</h1>
              <button className={cn(styles.editIcon, 'opacity-0 group-hover:opacity-100')} onClick={() => setIsEditingTitle(true)}>
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.center}>
        <div className={cn(styles.saveStatus, hasUnsavedChanges ? 'text-hint' : 'text-success')}>
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className={styles.spinner} />
              <span>Saving...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="flex items-center gap-2">
              <CloudOff size={14} />
              <span>Unsaved changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Cloud size={14} />
              <span>Saved {lastSavedAt ? `at ${new Date(lastSavedAt).toLocaleTimeString()}` : 'just now'}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <Button variant="secondary" size="sm" iconLeft={<Play size={16} />}>Run All</Button>
        <Button variant="primary" size="sm" iconLeft={<Download size={16} />}>Export</Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.moreBtn}><MoreVertical size={20} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
            <DropdownMenuItem onClick={toggleSettings}>Pipeline Settings</DropdownMenuItem>
            <DropdownMenuItem>Project Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Version History</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete Project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
