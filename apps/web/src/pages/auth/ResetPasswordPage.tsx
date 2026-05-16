import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button, Input } from '../../design-system/components';
import { authService } from '../../services/auth.service';
import styles from './AuthPage.module.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthLayout title="Invalid Link">
        <div className="text-center space-y-6">
          <AlertTriangle size={48} className="mx-auto text-danger" />
          <p className="text-muted">This password reset link is invalid or has expired.</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/forgot-password')}>
            Request new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create new password" 
      subtitle="Ensure your new password is strong and secure"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<ShieldCheck size={18} />}
            required
          />

          {error && <div className={styles.errorBanner}>{error}</div>}

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <CheckCircle2 size={48} className="mx-auto text-success" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Password reset complete</h3>
            <p className="text-muted">You can now sign in with your new password.</p>
          </div>
          <Button variant="primary" fullWidth onClick={() => navigate('/signin')}>
            Sign In Now
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
