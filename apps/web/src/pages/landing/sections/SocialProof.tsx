import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import styles from './SocialProof.module.css';

const logos = ['Luma AI', 'Runway', 'Pika', 'Midjourney', 'OpenAI'];

export function SocialProof() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className={styles.socialProof} ref={ref}>
      <div className={styles.container}>
        <div className={styles.logosRow}>
          <span className={styles.trustedText}>Trusted by creators at</span>
          <div className={styles.logos}>
            {logos.map(logo => (
              <span key={logo} className={styles.logoPlaceholder}>{logo}</span>
            ))}
          </div>
        </div>

        <div className={styles.statsRow}>
          <StatItem value={10000} suffix="+" label="Films Generated" inView={inView} />
          <StatItem value={50000} suffix="+" label="Scenes Created" inView={inView} />
          <StatItem value={98} suffix="%" label="Satisfaction Rate" inView={inView} />
          <StatItem value={4.9} suffix="/5" label="Average Rating" decimals={1} inView={inView} />
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, suffix, label, decimals = 0, inView }: { value: number, suffix: string, label: string, decimals?: number, inView: boolean }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;

    let start = 0;
    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = value / totalFrames;

    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      start += increment;
      
      if (currentFrame >= totalFrames) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div className={styles.statItem}>
      <div className={styles.statValue}>
        {count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
