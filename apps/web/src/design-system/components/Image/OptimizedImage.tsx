import React, { useState, useEffect } from 'react';
import { cn } from '../../../utils/styles';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './OptimizedImage.module.css';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  aspectRatio = 'auto',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }
    
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
  }, [src]);

  if (hasError && fallback) {
    return <div className={cn(styles.wrapper, styles[aspectRatio], className)}>{fallback}</div>;
  }

  return (
    <div className={cn(styles.wrapper, styles[aspectRatio], className)}>
      {!isLoaded && !hasError && (
        <Skeleton className={styles.skeleton} />
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          className={cn(
            styles.image,
            isLoaded ? styles.loaded : styles.hidden
          )}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}
