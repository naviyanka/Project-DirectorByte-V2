import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Ticket, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Clock,
  X,
  ArrowRight,
  Check
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../../design-system/components';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/styles';
import styles from './Checkout.module.css';

const PLAN_DATA: Record<string, any> = {
  creator: {
    name: 'Creator Plan',
    monthly: 19,
    annual: 190,
    features: ['500 AI credits', '20 GB storage', 'All studio modules']
  },
  studio: {
    name: 'Studio Plan',
    monthly: 49,
    annual: 490,
    features: ['2,000 AI credits', '100 GB storage', 'No watermark']
  }
};

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const planId = searchParams.get('plan') || 'creator';
  const cycle = searchParams.get('cycle') || 'annual';
  const plan = PLAN_DATA[planId] || PLAN_DATA.creator;
  const originalPrice = cycle === 'annual' ? plan.annual : plan.monthly;

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const discount = appliedPromo ? (originalPrice * (appliedPromo.percent / 100)) : 0;
  const totalPrice = originalPrice - discount;

  const handleApplyPromo = () => {
    if (!promoCode) return;
    setIsApplying(true);
    // Simulate API call
    setTimeout(() => {
      if (promoCode.toUpperCase() === 'SAVE30') {
        setAppliedPromo({ code: 'SAVE30', percent: 30, description: '30% Early Bird Discount' });
      } else {
        alert('Invalid promo code');
      }
      setIsApplying(false);
    }, 1000);
  };

  const handleComplete = () => {
    setIsProcessing(true);
    // Simulate payment gateway redirect/process
    setTimeout(() => {
      navigate('/checkout/success');
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/pricing" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Pricing</span>
        </Link>
        <h1 className={styles.title}>Complete your subscription</h1>
      </div>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.content}>
          <div className={styles.steps}>
            <div className={cn(styles.step, step >= 1 && styles.activeStep)}>
              <div className={styles.stepNumber}>1</div>
              <span>Plan & Promo</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={cn(styles.step, step >= 2 && styles.activeStep)}>
              <div className={styles.stepNumber}>2</div>
              <span>Payment</span>
            </div>
          </div>

          <Card className={styles.mainCard}>
            {step === 1 ? (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Review your plan</h3>
                  <div className="p-4 bg-surface-100 rounded-lg border border-surface-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{plan.name}</p>
                      <p className="text-sm text-hint">{cycle === 'annual' ? 'Billed annually' : 'Billed monthly'}</p>
                    </div>
                    <Badge variant="brand">Selected</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Promo Code</h3>
                  {appliedPromo ? (
                    <div className="p-4 bg-success-50 rounded-lg border border-success-200 flex justify-between items-center text-success-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        <div>
                          <p className="font-bold">Code {appliedPromo.code} applied!</p>
                          <p className="text-sm">You saved ${discount.toFixed(2)} ({appliedPromo.percent}% off)</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAppliedPromo(null)}
                        className="p-1 hover:bg-success-100 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="ENTER_PROMO_CODE" 
                        value={promoCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromoCode(e.target.value)}
                        fullWidth
                        leftIcon={<Ticket size={16} />}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleApplyPromo}
                        isLoading={isApplying}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  iconRight={<ArrowRight size={18} />}
                  onClick={() => setStep(2)}
                >
                  Continue to Payment
                </Button>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Secure Payment</h3>
                  <p className="text-sm text-hint mt-2">You'll be redirected to our secure payment processor.</p>
                </div>

                <div className="p-6 bg-surface-100 rounded-xl border border-surface-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded shadow-sm">
                      <CreditCard size={20} className="text-hint" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Stripe Secure Checkout</p>
                      <p className="text-xs text-hint">Supports all major credit cards & Apple Pay</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" fullWidth onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    variant="primary" 
                    fullWidth 
                    size="lg" 
                    onClick={handleComplete}
                    isLoading={isProcessing}
                  >
                    Pay ${totalPrice.toFixed(2)}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="mt-8 flex items-center justify-center gap-8 text-tertiary">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck size={14} />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} />
              <span>Verified Merchant</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} />
              <span>7-day free trial</span>
            </div>
          </div>
        </div>

        {/* Sidebar / Summary */}
        <aside className={styles.sidebar}>
          <Card header={<h3 className="font-bold">Order Summary</h3>} className={styles.summaryCard}>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{plan.name} ({cycle})</span>
                <span className="font-bold">${originalPrice.toFixed(2)}</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-sm text-success-600 font-bold">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-surface-200 flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-black">${totalPrice.toFixed(2)}</div>
                  <p className="text-[10px] text-hint uppercase tracking-wider font-bold">Billed {cycle}</p>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-hint">Plan highlights</p>
                <ul className="space-y-2">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-secondary">
                      <Check size={12} className="text-success-500" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <div className="p-4 bg-surface-100 rounded-lg border border-surface-200 mt-6">
            <p className="text-xs text-hint leading-relaxed">
              By completing your purchase, you agree to DirectorByte's 
              <Link to="/terms" className="text-brand-400 mx-1 underline">Terms of Service</Link> 
              and 
              <Link to="/privacy" className="text-brand-400 mx-1 underline">Privacy Policy</Link>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
