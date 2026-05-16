import React, { useState, useEffect } from 'react';
import { Film, Sparkles, AudioLines, Share2, Key } from 'lucide-react';
import { cn } from '@/utils/styles';
import styles from './AuthLeftPanel.module.css';

const features = [
  {
    icon: Film,
    title: 'Script to Screen',
    description: 'Turn any idea into a full film script in seconds.',
  },
  {
    icon: Sparkles,
    title: 'AI Storyboard',
    description: 'Generate keyframes and visual scenes automatically.',
  },
  {
    icon: AudioLines,
    title: 'AI Music & Voice',
    description: 'Add cinematic audio with one click.',
  },
  {
    icon: Share2,
    title: 'Export Anywhere',
    description: 'MP4, GIF, or share directly from the app.',
  },
  {
    icon: Key,
    title: 'Your Keys, Your Control',
    description: 'Use any AI provider you choose.',
  },
];

export function AuthLeftPanel() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      
      <div className={styles.content}>
        <div className={styles.brand}>
          <Film size={40} className={styles.logoIcon} />
          <div>
            <h1 className={styles.logoText}>DirectorByte</h1>
            <p className={styles.logoSubtext}>AI Film Engine</p>
          </div>
        </div>

        <div className={styles.carousel}>
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                styles.carouselItem,
                activeStep === index ? styles.active : styles.inactive
              )}
            >
              <div className={styles.iconWrapper}>
                <feature.icon size={32} />
              </div>
              <h2 className={styles.title}>{feature.title}</h2>
              <p className={styles.description}>{feature.description}</p>
            </div>
          ))}
          
          <div className={styles.dots}>
            {features.map((_, index) => (
              <div
                key={index}
                className={cn(styles.dot, activeStep === index && styles.dotActive)}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.trustInfo}>
            <p>Trusted by 10,000+ filmmakers worldwide</p>
            <div className={styles.avatars}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.avatar}>
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                </div>
              ))}
              <div className={styles.rating}>★★★★★</div>
            </div>
          </div>
          <p className={styles.copyright}>© 2024 DirectorByte AI Platform.</p>
        </div>
      </div>
    </div>
  );
}
