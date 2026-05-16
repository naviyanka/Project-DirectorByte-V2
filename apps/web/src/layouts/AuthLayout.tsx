import React from 'react';
import { Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AuthLeftPanel } from './AuthLayout/AuthLeftPanel';
import { scaleIn } from '../lib/motion';
import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const location = useLocation();

  return (
    <div className={styles.container}>
      {/* Decorative Panel */}
      <div className={styles.heroPanel}>
        <AuthLeftPanel />
      </div>

      {/* Form Panel */}
      <div className={styles.formPanel}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={scaleIn}
            className={styles.formCard}
          >
            <div className={styles.mobileHeader}>
              <Film size={24} className={styles.logoIcon} />
              <span className={styles.logoText}>DirectorByte</span>
            </div>
            
            <div className={styles.header}>
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>

            <div className={styles.body}>
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
