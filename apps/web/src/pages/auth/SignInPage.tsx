import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button, Input, Card } from '../../design-system/components';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/axios';
import styles from './AuthPage.module.css';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthStore();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      setToken(response.accessToken);
      setUser(response.user);
      
      addToast({
        title: 'Welcome back!',
        message: `Successfully signed in as ${response.user.displayName}`,
        type: 'success',
      });

      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : 'Invalid email or password';
      setError(message);
      addToast({
        title: 'Sign in failed',
        message: message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Store return path for callback
    sessionStorage.setItem('returnTo', from);
    window.location.href = authService.getGoogleAuthUrl();
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your DirectorByte account"
    >
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

        <div className={styles.fieldGroup}>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
          />
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}

        <div className="mt-6">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={isLoading}
            iconRight={<ChevronRight size={18} />}
          >
            Sign In
          </Button>
        </div>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          fullWidth 
          onClick={handleGoogleSignIn}
          iconLeft={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="w-5 h-5 mr-2" />}
        >
          Continue with Google
        </Button>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/signup" className="text-brand-500 font-bold hover:underline">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
