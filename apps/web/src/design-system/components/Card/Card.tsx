import React from 'react';
import { cn } from '../../../utils/styles';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  noPadding?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({
  className,
  variant = 'default',
  noPadding = false,
  hoverable = false,
  clickable = false,
  header,
  footer,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles[variant],
        noPadding && styles.noPadding,
        hoverable && styles.hoverable,
        clickable && styles.clickable,
        className
      )}
      {...props}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
