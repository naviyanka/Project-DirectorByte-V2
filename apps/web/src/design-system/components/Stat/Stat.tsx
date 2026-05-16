import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../utils/styles';
import styles from './Stat.module.css';

export interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: {
    value: number;
    isUp: boolean;
    label?: string;
  };
  className?: string;
}

export function Stat({ label, value, icon, delta, className }: StatProps) {
  return (
    <div className={cn(styles.stat, className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <div className={styles.icon}>{icon}</div>}
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.valueWrapper}>
        <span className={styles.value}>{value}</span>
        {delta && (
          <div className={cn(styles.delta, delta.isUp ? styles.up : styles.down)}>
            {delta.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{delta.value}%</span>
            {delta.label && <span className={styles.deltaLabel}>{delta.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
