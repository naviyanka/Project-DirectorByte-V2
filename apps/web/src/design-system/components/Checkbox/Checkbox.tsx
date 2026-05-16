import React, { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../../utils/styles';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, label, id, disabled, className }, ref) => {
    return (
      <div className={cn(styles.container, className)}>
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={styles.root}
        >
          <CheckboxPrimitive.Indicator className={styles.indicator}>
            <Check size={14} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <label 
            htmlFor={id} 
            className={cn(styles.label, disabled && styles.disabled)}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
