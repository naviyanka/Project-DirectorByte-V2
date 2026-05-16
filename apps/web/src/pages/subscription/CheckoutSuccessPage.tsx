import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Play } from 'lucide-react';
import { Button } from '../../design-system/components';
import { cn } from '../../utils/styles';
import styles from './Checkout.module.css';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className={cn(styles.successContainer, 'animate-fade-in')}>
      <div className={styles.checkmark}>
        <Check size={48} strokeWidth={3} />
      </div>

      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-black">🎬 You're on Creator Plan!</h1>
        <p className="text-lg text-hint">Your subscription is now active. Next billing: June 1, 2025 ($19.00)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
        {[
          { icon: <Sparkles className="text-brand-500" />, title: '500 AI credits', desc: 'Ready for use' },
          { icon: <Play className="text-success-500" />, title: 'All Studio Modules', desc: 'Unlimited access' },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-surface-100 rounded-xl border border-surface-200 text-left flex gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm h-fit">{item.icon}</div>
            <div>
              <p className="font-bold text-sm">{item.title}</p>
              <p className="text-xs text-hint">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 w-full">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          iconRight={<ArrowRight size={18} />}
          onClick={() => navigate('/home')}
        >
          Start Creating Now
        </Button>
        <p className="text-xs text-tertiary">
          Redirecting to dashboard in {countdown}s...
        </p>
      </div>
    </div>
  );
}
