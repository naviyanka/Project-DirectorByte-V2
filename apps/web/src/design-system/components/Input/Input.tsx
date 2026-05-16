import React, { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '../../../utils/styles';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      size = 'md',
      fullWidth = true,
      type = 'text',
      onClear,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const isSearch = type === 'search';
    
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={cn(styles.container, fullWidth && styles.fullWidth, className)}>
        {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
        
        <div className={styles.wrapper}>
          {leftAddon && <div className={styles.addon}>{leftAddon}</div>}
          
          <div className={cn(styles.inputWrapper, styles[size], error && styles.hasError)}>
            {isSearch && <Search className={styles.icon} size={16} />}
            {leftIcon && !isSearch && <span className={styles.icon}>{leftIcon}</span>}
            
            <input
              id={inputId}
              ref={ref}
              type={inputType}
              className={styles.input}
              {...props}
            />
            
            {isPassword && (
              <button
                type="button"
                className={styles.actionIcon}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
            
            {rightIcon && !isPassword && <span className={styles.icon}>{rightIcon}</span>}
            {rightAddon && <div className={styles.addon}>{rightAddon}</div>}
          </div>
        </div>
        
        {error && <p className={styles.errorText}>{error}</p>}
        {hint && !error && <p className={styles.hintText}>{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
