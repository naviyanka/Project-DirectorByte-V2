/**
 * Shared Framer Motion variants for consistent animations across DirectorByte.
 * Philosophy: Animations communicate state changes and should feel intentional.
 * Respects prefers-reduced-motion automatically.
 */

const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

const transition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };
const springTransition = { type: "spring", stiffness: 500, damping: 35 };

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: prefersReducedMotion ? { duration: 0.01 } : transition,
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: prefersReducedMotion ? { duration: 0.01 } : { ...transition, duration: 0.25 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: prefersReducedMotion ? { duration: 0.01 } : { ...transition, duration: 0.28 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
};

export const staggerContainer = {
  animate: { 
    transition: { 
      staggerChildren: 0.06, 
      delayChildren: 0.1 
    } 
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

export const layoutTransition = {
  layout: true,
  transition: springTransition
};
