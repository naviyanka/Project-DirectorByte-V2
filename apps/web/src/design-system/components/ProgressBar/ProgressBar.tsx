import React from 'react';
import { cn } from '../../../utils/styles';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'brand' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showValue = false,
  size = 'md',
  variant,
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));
  
  const status = variant || (percentage >= 95 ? 'danger' : percentage >= 80 ? 'warning' : 'brand');

  return (
    <div className={cn(styles.container, className)}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn(styles.track, styles[size])}>
        <div 
          className={cn(styles.fill, styles[status], animated && styles.animated)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
