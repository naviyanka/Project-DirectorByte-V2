import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../../utils/styles';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  title?: string;
  description?: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  onOpenChange?: (open: boolean) => void;
}

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(styles.viewport, className)}
    {...props}
  />
));

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ id, title, description, variant = 'info', onOpenChange, ...props }, ref) => {
  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[variant];

  return (
    <ToastPrimitive.Root
      ref={ref}
      onOpenChange={onOpenChange}
      className={cn(styles.root, styles[variant])}
      {...props}
    >
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <Icon size={20} />
        </div>
        
        <div className={styles.content}>
          {title && <ToastPrimitive.Title className={styles.title}>{title}</ToastPrimitive.Title>}
          {description && (
            <ToastPrimitive.Description className={styles.description}>
              {description}
            </ToastPrimitive.Description>
          )}
        </div>
        
        <ToastPrimitive.Close className={styles.close}>
          <X size={16} />
        </ToastPrimitive.Close>
      </div>
      
      <div className={styles.progressBar} />
    </ToastPrimitive.Root>
  );
});

ToastViewport.displayName = ToastPrimitive.Viewport.displayName;
Toast.displayName = ToastPrimitive.Root.displayName;
