import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../design-system/components';
import styles from './FinalCTA.module.css';

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>🎬</div>
          <h2 className={styles.title}>Ready to Direct Your Vision?</h2>
          <p className={styles.subtitle}>
            Join 10,000+ filmmakers using AI to tell their stories.
            Start free today — no credit card required.
          </p>
          <div className={styles.actions}>
            <Button size="lg" iconRight={<ArrowRight size={20} />} onClick={() => navigate('/signup')}>
              Create Your First Film — Free
            </Button>
            <div className={styles.signInRow}>
              <span>or</span>
              <button className={styles.signInBtn} onClick={() => navigate('/signin')}>
                Sign in if you have an account
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.glow} />
    </section>
  );
}
