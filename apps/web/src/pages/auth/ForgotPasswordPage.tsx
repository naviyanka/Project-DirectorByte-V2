import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button, Input } from '../../design-system/components';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/styles';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="We'll send you a link to get back into your account"
    >
      <Link to="/signin" className={cn(styles.forgotLink, 'mb-8 inline-flex items-center gap-2')} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            required
            autoFocus
          />

          {error && <div className={styles.errorBanner}>{error}</div>}

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success-50 text-success-600 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Check your inbox</h3>
            <p className="text-muted text-sm">
              We've sent a password reset link to <span className="text-brand-500 font-medium">{email}</span>.
              The link will expire in 1 hour.
            </p>
          </div>
          <Button variant="outline" fullWidth onClick={() => setIsSuccess(false)}>
            Resend email
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
