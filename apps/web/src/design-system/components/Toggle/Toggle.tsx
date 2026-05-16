import React from 'react';
import * as Switch from '@radix-ui/react-switch';
import { cn } from '../../../utils/styles';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  labelPosition = 'right',
  size = 'md',
  disabled = false,
  className,
}: ToggleProps) {
  const switchElement = (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(styles.root, styles[size], className)}
    >
      <Switch.Thumb className={styles.thumb} />
    </Switch.Root>
  );

  if (!label) return switchElement;

  return (
    <label className={cn(styles.container, disabled && styles.disabled)}>
      {labelPosition === 'left' && <span className={styles.label}>{label}</span>}
      {switchElement}
      {labelPosition === 'right' && <span className={styles.label}>{label}</span>}
    </label>
  );
}
