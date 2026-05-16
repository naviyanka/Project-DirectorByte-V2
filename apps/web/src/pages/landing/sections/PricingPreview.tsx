import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../../../design-system/components';
import styles from './PricingPreview.module.css';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For hobbyists exploring AI film.',
    features: ['5 projects', '50 credits /mo', 'BYO API keys', 'Community support'],
    cta: 'Get Started',
    variant: 'ghost'
  },
  {
    name: 'Creator',
    price: '$19',
    popular: true,
    description: 'For active creators and storytellers.',
    features: ['Unlimited projects', '500 credits /mo', 'Managed API keys', 'Priority support', 'Google Drive sync'],
    cta: 'Get Creator',
    variant: 'primary'
  },
  {
    name: 'Studio',
    price: '$49',
    description: 'For professional production teams.',
    features: ['Everything in Creator', '2000 credits /mo', 'Commercial rights', 'Early beta access', 'Custom workflows'],
    cta: 'Get Studio',
    variant: 'outline'
  }
];

export function PricingPreview() {
  return (
    <section id="pricing" className={styles.pricing}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Simple, Transparent Pricing</h2>
          <p className={styles.subtitle}>Start for free, upgrade as your vision grows.</p>
        </div>

        <div className={styles.grid}>
          {plans.map((plan) => (
            <div key={plan.name} className={cn(styles.card, plan.popular && styles.popular)}>
              {plan.popular && <div className={styles.badge}>Most Popular</div>}
              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>/mo</span>
                </div>
                <p className={styles.description}>{plan.description}</p>
              </div>

              <div className={styles.featuresList}>
                {plan.features.map((feature) => (
                  <div key={feature} className={styles.feature}>
                    <Check size={16} className={styles.checkIcon} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.variant as any} 
                fullWidth 
                size="lg"
                className={styles.cta}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p className={styles.trustSignals}>
            ✓ No credit card for Free   ·   ✓ Cancel anytime   ·   ✓ Promo codes accepted
          </p>
          <Link to="/pricing" className={styles.fullPricingLink}>
            View full pricing comparison <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Helper since I don't have cn here yet
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
