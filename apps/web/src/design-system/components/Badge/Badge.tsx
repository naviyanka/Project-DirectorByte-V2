import React from 'react';
import { cn } from '../../../utils/styles';
import styles from './Badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        styles.badge,
        styles[variant],
        styles[size],
        dot && styles.dotOnly,
        className
      )}
      {...props}
    >
      {dot && <span className={styles.dot} />}
      {!dot && children}
    </span>
  );
}
