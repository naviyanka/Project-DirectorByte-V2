import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../Button/Button';
import { cn } from '../../../utils/styles';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(styles.container, className)}>
      {icon && (
        <div className={styles.iconWrapper}>
          {icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  );
}
