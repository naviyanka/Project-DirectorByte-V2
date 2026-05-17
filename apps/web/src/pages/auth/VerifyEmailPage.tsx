import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../design-system/components';
import { authService } from '../../services/auth.service';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/axios';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'pending'
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async () => {
    try {
      await authService.verifyEmail(token!);
      setStatus('success');
      addToast({
        title: 'Email verified!',
        message: 'Your account is now active.',
        type: 'success',
      });
    } catch (err) {
      setStatus('error');
      addToast({
        title: 'Verification failed',
        message: err instanceof ApiError ? err.message : 'Invalid or expired token.',
        type: 'error',
      });
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    
    try {
      await authService.resendVerification(email);
      setCooldown(60);
      addToast({
        title: 'Verification sent',
        message: 'A new link has been sent to your inbox.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err instanceof ApiError ? err.message : 'Failed to resend link',
        type: 'error',
      });
    }
  };

  if (status === 'verifying') {
    return (
      <AuthLayout title="Verifying your email...">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-brand-400" />
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email Verified!">
        <div className="text-center space-y-6">
          <CheckCircle2 size={64} className="mx-auto text-success-500" />
          <p className="text-secondary text-sm">Your account is ready. Welcome to the director's chair.</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/signin')} iconRight={<ArrowRight size={18} />}>
            Go to Studio
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout title="Link Expired">
        <div className="text-center space-y-6">
          <AlertTriangle size={64} className="mx-auto text-danger-500" />
          <p className="text-secondary text-sm">This verification link has expired or already been used.</p>
          <Button variant="primary" fullWidth onClick={() => setStatus('pending')}>
            Request new link
          </Button>
          <Link to="/signin" className="block text-sm text-brand-500 font-bold hover:underline">Back to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check your inbox">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-900 text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Mail size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-secondary text-sm">
            We've sent a verification link to <br />
            <span className="text-primary font-black text-lg">{email || 'your email'}</span>
          </p>
          <p className="text-xs text-hint">Click the link in the email to activate your account.</p>
        </div>

        <div className="pt-4 space-y-4">
          <Button 
            variant="outline" 
            fullWidth 
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </Button>
          <Link to="/signin" className="block text-sm text-hint hover:text-primary transition-colors font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
