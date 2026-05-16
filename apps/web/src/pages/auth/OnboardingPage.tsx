import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Sparkles, HardDrive, Cpu, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system/components';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { useToast } from '../../hooks/useToast';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../utils/styles';
import styles from './AuthPage.module.css';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    interests: [] as string[],
    aiSetup: 'managed' as 'managed' | 'byok',
    storage: 'local' as 'local' | 'drive',
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleComplete = async () => {
    try {
      // Save to backend
      const updatedUser = await authService.updateProfile({ 
        onboardingComplete: true 
      });
      
      setUser(updatedUser);
      
      addToast({
        title: "You're all set!",
        message: "Welcome to DirectorByte. Let's make some movies.",
        type: 'success',
      });
      
      navigate('/home');
    } catch (err) {
      addToast({
        title: "Error",
        message: "Failed to save your preferences.",
        type: 'error',
      });
    }
  };

  const toggleInterest = (interest: string) => {
    setSelections(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="text-brand-400" size={24} />
            <span className="font-bold text-xl">DirectorByte</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-brand-400" : i < step ? "w-4 bg-success" : "w-4 bg-surface-400"
                )} 
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className={styles.onboardingStep}>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Welcome, {(user?.displayName || user?.name || 'Director').split(' ')[0]}! 🎬</h1>
              <p className={styles.stepDescription}>
                Let's set up your workspace to match your creative style. It only takes a minute.
              </p>
            </div>
            <div className="flex justify-center py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-400 blur-3xl opacity-20 animate-pulse" />
                <Film size={120} className="text-brand-400 relative" />
              </div>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={nextStep} iconRight={<ArrowRight size={20} />}>
              Get Started
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.onboardingStep}>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>What will you create?</h1>
              <p className={styles.stepDescription}>Select the types of content you're most interested in making.</p>
            </div>
            <div className={styles.interestGrid}>
              {['Short Films', 'Music Videos', 'Stories', 'Documentaries', 'Game Trailers', 'Ads & Promos', 'Educational', 'Exploration'].map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    styles.interestButton,
                    selections.interests.includes(interest) && styles.interestButtonActive
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" iconLeft={<ChevronLeft size={18} />} onClick={prevStep}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={nextStep} disabled={selections.interests.length === 0}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.onboardingStep}>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Choose your AI setup</h1>
              <p className={styles.stepDescription}>Decide how you want to power your cinematic generations.</p>
            </div>
            <div className={styles.grid}>
              <Card 
                className={cn(styles.selectionCard, selections.aiSetup === 'byok' && styles.selectionCardActive)}
                onClick={() => setSelections(prev => ({ ...prev, aiSetup: 'byok' }))}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-surface-300 rounded-lg"><Cpu size={24} className="text-brand-400" /></div>
                  <Badge variant="brand" size="sm">FREE</Badge>
                </div>
                <h3 className="font-bold mb-1">Use my own keys</h3>
                <p className="text-xs text-muted">Connect Gemini or OpenAI. Only pay for what you use.</p>
              </Card>
              <Card 
                className={cn(styles.selectionCard, selections.aiSetup === 'managed' && styles.selectionCardActive)}
                onClick={() => setSelections(prev => ({ ...prev, aiSetup: 'managed' }))}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-brand-900 rounded-lg"><Sparkles size={24} className="text-brand-400" /></div>
                  <Badge variant="success" size="sm">POPULAR</Badge>
                </div>
                <h3 className="font-bold mb-1">Managed AI</h3>
                <p className="text-xs text-muted">No keys needed. Unlimited high-speed production on our plans.</p>
              </Card>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" iconLeft={<ChevronLeft size={18} />} onClick={prevStep}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={nextStep}>Continue</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.onboardingStep}>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Storage preference</h1>
              <p className={styles.stepDescription}>Where should we save your cinematic projects?</p>
            </div>
            <div className={styles.grid}>
              <Card 
                className={cn(styles.selectionCard, selections.storage === 'local' && styles.selectionCardActive)}
                onClick={() => setSelections(prev => ({ ...prev, storage: 'local' }))}
              >
                <div className="p-2 bg-surface-300 rounded-lg w-fit mb-4"><HardDrive size={24} className="text-brand-400" /></div>
                <h3 className="font-bold mb-1">DirectorByte Cloud</h3>
                <p className="text-xs text-muted">Secure storage on our servers. Access projects from any device.</p>
              </Card>
              <Card 
                className={cn(styles.selectionCard, selections.storage === 'drive' && styles.selectionCardActive)}
                onClick={() => setSelections(prev => ({ ...prev, storage: 'drive' }))}
              >
                <div className="p-2 bg-surface-300 rounded-lg w-fit mb-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">Google Drive</h3>
                <p className="text-xs text-muted">Save directly to your Drive. You own your raw project files.</p>
              </Card>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" iconLeft={<ChevronLeft size={18} />} onClick={prevStep}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={handleComplete} iconRight={<CheckCircle2 size={18} />}>
                Let's go!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
