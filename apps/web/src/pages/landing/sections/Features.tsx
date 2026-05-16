import React from 'react';
import { motion } from 'framer-motion';
import { Scroll, Grid, Film, Music, Key, Cloud } from 'lucide-react';
import { fadeIn, slideUp } from '../../../lib/motion';
import styles from './Features.module.css';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  visual: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    icon: <Scroll />,
    title: "From Concept to Complete Script",
    description: "Describe your story idea and watch DirectorByte write a production-ready screenplay — character arcs, dialogue, scene descriptions — all in seconds.",
    visual: <div className={styles.visualScript} />
  },
  {
    icon: <Grid />,
    title: "Visualize Every Scene",
    description: "Generate cinematic keyframe images for each scene automatically. Customize the visual style, lighting, and mood with natural language prompts.",
    visual: <div className={styles.visualStoryboard} />
  },
  {
    icon: <Film />,
    title: "Bring Storyboards to Life",
    description: "Transform keyframes into full video sequences using state-of-the-art video models — RunwayML, Kling, or Pika. Your choice of provider.",
    visual: <div className={styles.visualVideo} />
  },
  {
    icon: <Music />,
    title: "Sound That Matches Your Vision",
    description: "Generate royalty-free background music with AI, then add professional voice-over narration — all in the same pipeline.",
    visual: <div className={styles.visualAudio} />
  },
  {
    icon: <Key />,
    title: "Total Provider Flexibility",
    description: "Use our managed API keys on paid plans, or bring your own for any module. Mix and match providers per feature — you're never locked in.",
    visual: <div className={styles.visualKeys} />
  },
  {
    icon: <Cloud />,
    title: "Cloud Storage Built In",
    description: "Sign in with Google to sync all your projects directly to your Drive. Access your films from any device, anytime.",
    visual: <div className={styles.visualCloud} />
  }
];

export function Features() {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Everything you need to create films</h2>
          <p className={styles.subtitle}>A complete AI-powered production suite in one unified interface.</p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className={styles.feature}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={index % 2 === 0 ? slideUp : slideUp}
            >
              <div className={styles.content}>
                <div className={styles.icon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
              <div className={styles.visualContainer}>
                {feature.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
