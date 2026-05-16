import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { LandingNav } from '../../components/LandingNav/LandingNav';
import { Hero } from './sections/Hero';
import { SocialProof } from './sections/SocialProof';
import { Features } from './sections/Features';
import { Pipeline } from './sections/Pipeline';
import { PricingPreview } from './sections/PricingPreview';
import { FAQ } from './sections/FAQ';
import { FinalCTA } from './sections/FinalCTA';
import { Footer } from './sections/Footer';
import { Helmet } from 'react-helmet-async';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <div className={styles.landing}>
      <Helmet>
        <title>DirectorByte — AI Film Generator</title>
        <meta name="description" content="Turn your ideas into cinematic films with AI. Generate scripts, storyboards, keyframes, video, and audio in one pipeline." />
        <meta property="og:title" content="DirectorByte — AI Film Generator" />
        <meta property="og:description" content="The complete AI-powered production suite for filmmakers." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <LandingNav />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Pipeline />
        <PricingPreview />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
