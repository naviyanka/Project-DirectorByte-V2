import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '../../../design-system/components';
import { fadeIn, slideUp, staggerContainer } from '../../../lib/motion';
import styles from './Hero.module.css';

export function Hero() {
  const headline = "Turn Ideas Into Cinematic Films With AI";
  const words = headline.split(' ');

  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <div className={styles.mesh} />
      </div>
      
      <div className={styles.content}>
        <motion.div 
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className={styles.badge}
        >
          <span className={styles.badgeEmoji}>🎬</span>
          <span>Now in Beta — AI Film Generation</span>
        </motion.div>

        <motion.h1 
          className={styles.title}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {words.map((word, i) => (
            <motion.span 
              key={i} 
              variants={slideUp}
              className="inline-block mr-[0.2em]"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p 
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          DirectorByte transforms your concept into a full production pipeline — 
          script, storyboard, keyframes, video, and soundtrack — in minutes.
        </motion.p>

        <motion.div 
          className={styles.actions}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
        >
          <Button size="lg" iconRight={<ArrowRight size={20} />}>
            Start for Free
          </Button>
          <Button variant="outline" size="lg" iconLeft={<Play size={20} />}>
            Watch Demo
          </Button>
        </motion.div>

        <motion.div 
          className={styles.trust}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className={styles.trustItem}>⭐ 4.9/5 rating</div>
          <div className={styles.trustDivider} />
          <div className={styles.trustItem}>10,000+ creators</div>
          <div className={styles.trustDivider} />
          <div className={styles.trustItem}>No credit card required</div>
        </motion.div>
      </div>

      <motion.div 
        className={styles.visual}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <div className={styles.mockupContainer}>
          <div className={styles.mockup}>
            {/* Using a placeholder for the app preview */}
            <div className={styles.mockupInner}>
              <div className={styles.mockupSidebar} />
              <div className={styles.mockupContent}>
                <div className={styles.mockupGrid}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className={styles.mockupCard} />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.mockupGlow} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
