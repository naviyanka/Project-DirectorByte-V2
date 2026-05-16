import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ShieldCheck, ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button, Input, Checkbox } from '../../design-system/components';
import { authService } from '../../services/auth.service';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/axios';
import styles from './AuthPage.module.css';

export function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState(searchParams.get('promo') || '');
  const [showPromo, setShowPromo] = useState(!!searchParams.get('promo'));
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    setStrength(score);
  }, [password]);

  const strengthInfo = [
    { label: 'Very Weak', color: '#EF4444' },
    { label: 'Weak', color: '#EF4444' },
    { label: 'Fair', color: '#F59E0B' },
    { label: 'Strong', color: '#6366F1' },
    { label: 'Very Strong', color: '#10B981' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.register({ displayName, email, password, promoCode });
      addToast({
        title: 'Account created!',
        message: 'Please check your email to verify your account.',
        type: 'success',
      });
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      navigate(isDev ? '/signin' : `/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      setError(message);
      addToast({
        title: 'Registration failed',
        message: message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create account" 
      subtitle="Start your AI cinematic journey"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Display Name"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<UserIcon size={18} />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          required
        />

        <div className={styles.strengthMeter}>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
          />
          {password && (
            <div className="flex gap-1 mt-2 items-center">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="h-1 flex-1 rounded-full bg-surface-200 transition-colors"
                  style={{ 
                    backgroundColor: i <= strength ? strengthInfo[strength].color : undefined 
                  }}
                />
              ))}
              <span className="text-[10px] font-bold ml-2 transition-colors" style={{ color: strengthInfo[strength].color }}>
                {strengthInfo[strength].label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<ShieldCheck size={18} />}
          required
          error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
        />

        {!showPromo ? (
          <button 
            type="button" 
            className="text-xs font-bold text-brand-500 hover:underline text-left self-start mt-1" 
            onClick={() => setShowPromo(true)}
          >
            Have a promo code?
          </button>
        ) : (
          <Input
            label="Promo Code"
            placeholder="ENTERPRISE20"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        )}

        <div className="mt-4">
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(!!checked)}
            label="I agree to the Terms of Service and Privacy Policy"
          />
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className="mt-6">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={isLoading}
            disabled={!agreeTerms}
            iconRight={<ChevronRight size={18} />}
          >
            Create Account
          </Button>
        </div>

        <p className={styles.footerText}>
          Already have an account? <Link to="/signin" className="text-brand-500 font-bold hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
