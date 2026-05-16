import React from 'react';
import { cn } from '../../../utils/styles';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn(styles.spinner, styles[size], className)} aria-label="Loading" />
  );
}
