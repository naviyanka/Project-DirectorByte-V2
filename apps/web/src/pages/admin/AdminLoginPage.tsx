import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../design-system/components';
import { useAdminStore } from '../../store/admin.store';
import { useToast } from '../../hooks/useToast';
import axios from '../../lib/axios';
import { cn } from '../../utils/styles';
import styles from './AdminLogin.module.css';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginMock } = useAdminStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      addToast({ title: 'Please enter credentials', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/admin/auth/login', { username, password });
      // In a real app we'd set the token securely, for now we follow the mock setup
      localStorage.setItem('adminToken', response.data.data.token);
      loginMock(username);
      navigate('/admin');
    } catch (error: any) {
      addToast({ title: 'Login failed', message: error.response?.data?.error?.message || 'Invalid credentials', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={cn(styles.blob, styles.blob1)} />
      <div className={cn(styles.blob, styles.blob2)} />
      
      <div className={styles.content}>
        <div className="text-center mb-8">
          <div className={styles.logoWrapper}>
            <Shield size={40} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Admin Center</h1>
          <p className={styles.subtitle}>Restricted access only. All actions are logged.</p>
        </div>

        <Card className={styles.card}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@directorbyte.com"
              fullWidth
              autoFocus
              leftIcon={<Mail size={18} />}
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              className={styles.adminInput}
            />

            <div className="relative">
              <Input
                label="Security Key"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                fullWidth
                leftIcon={<Lock size={18} />}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className={styles.adminInput}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              size="lg"
              className={styles.adminButton}
              isLoading={isSubmitting}
              iconRight={<ArrowRight size={18} />}
            >
              Sign In to Admin Center
            </Button>
          </form>
        </Card>

        <footer className={styles.footer}>
          <p>Unauthorized access is prohibited by law.</p>
        </footer>
      </div>
    </div>
  );
}
