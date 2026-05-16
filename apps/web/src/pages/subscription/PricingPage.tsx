import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system/components';
import { useAuthStore } from '../../store/auth.store';
import { billingService } from '../../services/billing.service';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/styles';
import styles from './PricingPage.module.css';

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingService.getPlans(),
  });

  const handlePlanSelect = async (planId: string) => {
    if (!isAuthenticated) {
      navigate(`/signup?plan=${planId.toLowerCase()}&cycle=${isAnnual ? 'annual' : 'monthly'}`);
      return;
    }

    // If it's the free plan, we might just update the user's plan or show a message
    if (planId === 'FREE' || planId === 'free') {
      addToast({ title: 'Free plan', message: 'You are already on the free plan.', type: 'info' });
      return;
    }

    try {
      const { checkoutUrl } = await billingService.createCheckoutSession({
        planId,
        billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY'
      });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      addToast({ title: 'Checkout error', message: err.message, type: 'error' });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-brand-500 font-bold">Loading plans...</div>;

  return (
    <div className={styles.page}>
      {/* Public Header */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>DB</div>
            <span>DirectorByte</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/signin')}>Sign In</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>Simple, transparent pricing</h1>
          <p className={styles.subtitle}>From hobbyist to professional filmmaker. Choose the plan that fits your vision.</p>
          
          <div className={styles.billingToggle}>
            <span className={cn(styles.toggleLabel, !isAnnual && styles.activeLabel)}>Monthly</span>
            <button 
              className={styles.toggleTrack}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div className={cn(styles.toggleThumb, isAnnual && styles.thumbRight)} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn(styles.toggleLabel, isAnnual && styles.activeLabel)}>Annual</span>
              <Badge variant="success" size="sm">Save 17%</Badge>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className={styles.grid}>
          {plans?.map((plan) => {
            const isCurrent = user?.planId === plan.id;
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const isFree = price === 0;
            
            return (
              <Card 
                key={plan.id} 
                className={cn(styles.card, plan.slug === 'creator' && styles.popular)}
              >
                {plan.slug === 'creator' && <div className={styles.popularBadge}>MOST POPULAR</div>}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-hint">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-hint text-sm">/{isAnnual ? 'yr' : 'mo'}</span>
                  </div>
                  {isAnnual && !isFree && (
                    <p className="text-xs text-success-600 font-bold mt-1">
                      ${Math.floor(plan.priceAnnual / 12)}/mo billed annually
                    </p>
                  )}
                </div>

                <Button 
                  variant={plan.slug === 'creator' ? 'primary' : 'outline'} 
                  fullWidth 
                  className="mb-8"
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : isFree ? 'Get Started' : 'Start Free Trial'}
                </Button>

                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-hint">What's included</p>
                  <ul className="space-y-3">
                    {(plan.features as any[]).map((feature, i) => (
                      <li key={i} className={cn("flex items-start gap-3 text-sm", !feature.included && "text-tertiary")}>
                        {feature.included ? (
                          <div className="mt-0.5 text-success-500"><Check size={16} strokeWidth={3} /></div>
                        ) : (
                          <div className="mt-0.5 text-surface-400"><X size={16} /></div>
                        )}
                        <span>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 DirectorByte AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
