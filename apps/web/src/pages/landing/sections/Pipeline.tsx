import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Grid, Image as ImageIcon, Film, Music, Mic, Download, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/styles';
import styles from './Pipeline.module.css';

const stages = [
  { id: 'script', icon: <Scroll size={24} />, label: 'Script', title: 'AI Screenplay', description: 'Transform your prompt into a full script with scenes, dialogue, and character notes.' },
  { id: 'storyboard', icon: <Grid size={24} />, label: 'Storyboard', title: 'Scene Mapping', description: 'Break down your script into a visual storyboard with automated scene detection.' },
  { id: 'keyframes', icon: <ImageIcon size={24} />, label: 'Keyframes', title: 'Visual Direction', description: 'Generate high-fidelity cinematic images for every key frame of your film.' },
  { id: 'video', icon: <Film size={24} />, label: 'Video', title: 'Motion Generation', description: 'Animate your keyframes into fluid video sequences using state-of-the-art models.' },
  { id: 'audio', icon: <Music size={24} />, label: 'Audio', title: 'Sound Design', description: 'Generate immersive background scores and ambient sound effects.' },
  { id: 'voiceover', icon: <Mic size={24} />, label: 'Voiceover', title: 'Narrative Voice', description: 'Add professional AI narration with perfect timing and emotional range.' },
  { id: 'export', icon: <Download size={24} />, label: 'Export', title: 'Master File', description: 'Export your finished film in 4K resolution with all layers synchronized.' },
];

export function Pipeline() {
  const [activeStage, setActiveStage] = useState(stages[0]);

  return (
    <section id="pipeline" className={styles.pipeline}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create a Film in 7 Steps</h2>
          <p className={styles.subtitle}>Our intelligent pipeline handles the heavy lifting, so you can focus on directing.</p>
        </div>

        <div className={styles.stepperContainer}>
          <div className={styles.stepper}>
            {stages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <button 
                  className={cn(styles.step, activeStage.id === stage.id && styles.active)}
                  onMouseEnter={() => setActiveStage(stage)}
                  onClick={() => setActiveStage(stage)}
                >
                  <div className={styles.stepIcon}>{stage.icon}</div>
                  <span className={styles.stepLabel}>{stage.label}</span>
                </button>
                {index < stages.length - 1 && (
                  <div className={styles.connector}>
                    <ChevronRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className={styles.display}>
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeStage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={styles.displayContent}
              >
                <div className={styles.displayText}>
                  <div className={styles.stageNumber}>Step {stages.indexOf(activeStage) + 1}</div>
                  <h3 className={styles.stageTitle}>{activeStage.title}</h3>
                  <p className={styles.stageDescription}>{activeStage.description}</p>
                </div>
                <div className={styles.displayVisual}>
                  {/* Mock visual for the stage */}
                  <div className={cn(styles.visualPlaceholder, styles[activeStage.id])} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
