import React, { useState, useEffect } from 'react';
import { Shield, Database, User, CheckCircle2, Lock, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Spinner } from '../../design-system/components';
import { useToast } from '../../hooks/useToast';
import axios from '../../lib/axios';

type Step = 'preflight' | 'database' | 'admin' | 'progress' | 'success';

export const InstallPage = () => {
  const [step, setStep] = useState<Step>('preflight');
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isInstalling, setIsInstalling] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    databaseUrl: '',
    appName: 'DirectorByte',
    appUrl: window.location.origin,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const [progressLog, setProgressLog] = useState<string[]>([
    'Initializing setup...'
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTestDb = async () => {
    if (!formData.databaseUrl) {
      addToast({ title: 'Database URL required', type: 'error' });
      return;
    }
    setIsCheckingDb(true);
    setDbStatus('idle');
    try {
      await axios.post('/install/check-db', { databaseUrl: formData.databaseUrl });
      setDbStatus('success');
      addToast({ title: 'Connection successful', type: 'success' });
    } catch (err: any) {
      setDbStatus('error');
      addToast({ title: 'Connection failed', message: err.response?.data?.error?.message || err.message, type: 'error' });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleInstall = async () => {
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      addToast({ title: 'Passwords do not match', type: 'error' });
      return;
    }
    if (formData.adminPassword.length < 8) {
      addToast({ title: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setStep('progress');
    setIsInstalling(true);
    setProgressLog(prev => [...prev, 'Writing configuration to .env...']);

    try {
      await axios.post('/install/setup', formData);
      setProgressLog(prev => [
        ...prev,
        'Running database migrations... ✓',
        'Creating Super Admin user... ✓',
        'Locking installer... ✓',
        'Installation complete!'
      ]);
      setTimeout(() => {
        setStep('success');
      }, 1500);
    } catch (err: any) {
      setProgressLog(prev => [...prev, `❌ Error: ${err.response?.data?.error?.message || err.message}`]);
      addToast({ title: 'Installation failed', message: 'Check progress log', type: 'error' });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDisable = async () => {
    try {
      await axios.post('/install/disable');
      window.location.href = '/signin';
    } catch (err) {
      addToast({ title: 'Failed to disable installer', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black">DirectorByte Setup</h1>
          <p className="text-hint mt-2">Let's get your platform configured.</p>
        </div>

        <Card className="shadow-xl">
          {/* STEP 1: Pre-flight */}
          {step === 'preflight' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-brand-500" /> Pre-flight Checks
              </h2>
              <div className="space-y-3 bg-surface-100 p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Node.js Environment</span>
                  <CheckCircle2 size={18} className="text-success-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>File System Write Access</span>
                  <CheckCircle2 size={18} className="text-success-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>No existing configuration found</span>
                  <CheckCircle2 size={18} className="text-success-500" />
                </div>
              </div>
              <Button
                variant="primary"
                fullWidth
                iconRight={<ArrowRight size={18} />}
                onClick={() => setStep('database')}
              >
                Continue to Database Setup
              </Button>
            </div>
          )}

          {/* STEP 2: Database */}
          {step === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="text-brand-500" /> Database Configuration
              </h2>
              <p className="text-sm text-hint">
                Provide your PostgreSQL connection string. Prisma requires this to initialize your database schema.
              </p>

              <div className="space-y-4">
                <Input
                  label="PostgreSQL Connection URL *"
                  name="databaseUrl"
                  placeholder="postgresql://user:password@localhost:5432/db"
                  value={formData.databaseUrl}
                  onChange={handleChange}
                  fullWidth
                />

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleTestDb}
                    isLoading={isCheckingDb}
                  >
                    Test Connection
                  </Button>

                  {dbStatus === 'success' && (
                    <span className="text-success-500 flex items-center gap-1 text-sm font-medium">
                      <CheckCircle2 size={16} /> Connection successful
                    </span>
                  )}
                  {dbStatus === 'error' && (
                    <span className="text-danger-500 flex items-center gap-1 text-sm font-medium">
                      <AlertCircle size={16} /> Connection failed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-surface-200">
                <Button variant="outline" onClick={() => setStep('preflight')}>Back</Button>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={dbStatus !== 'success'}
                  onClick={() => setStep('admin')}
                >
                  Continue to Admin Setup
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Admin */}
          {step === 'admin' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="text-brand-500" /> Super Admin Setup
              </h2>
              <p className="text-sm text-hint">
                Create the master account that will manage the platform.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Platform Name"
                    name="appName"
                    value={formData.appName}
                    onChange={handleChange}
                    fullWidth
                  />
                  <Input
                    label="Platform URL"
                    name="appUrl"
                    value={formData.appUrl}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>
                <Input
                  label="Admin Name *"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  fullWidth
                />
                <Input
                  label="Admin Email *"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Password *"
                    name="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    fullWidth
                  />
                  <Input
                    label="Confirm Password *"
                    name="adminPasswordConfirm"
                    type="password"
                    value={formData.adminPasswordConfirm}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-surface-200">
                <Button variant="outline" onClick={() => setStep('database')}>Back</Button>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!formData.adminEmail || !formData.adminPassword}
                  onClick={handleInstall}
                >
                  Run Installation
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Progress */}
          {step === 'progress' && (
            <div className="space-y-6 animate-fade-in py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                {isInstalling ? (
                  <Spinner size="xl" className="text-brand-500" />
                ) : (
                  <CheckCircle2 size={48} className="text-success-500" />
                )}
                <h2 className="text-2xl font-bold">
                  {isInstalling ? 'Installing DirectorByte...' : 'Installation Failed'}
                </h2>
              </div>

              <div className="bg-surface-950 text-surface-50 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {progressLog.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
              </div>

              {!isInstalling && progressLog[progressLog.length - 1]?.includes('Error') && (
                <Button variant="outline" fullWidth onClick={() => setStep('admin')}>
                  Try Again
                </Button>
              )}
            </div>
          )}

          {/* STEP 5: Success */}
          {step === 'success' && (
            <div className="space-y-8 animate-fade-in text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-500/10 text-success-500 mb-2">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black">Installation Complete!</h2>
                <p className="text-hint mt-2">Your platform is ready. The server is restarting to apply the configuration.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => window.location.href = '/home'}
                >
                  Go to App
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => window.location.href = '/admin/login'}
                >
                  Admin Center
                </Button>
              </div>

              <div className="pt-8 border-t border-surface-200">
                <p className="text-sm text-hint mb-4">
                  For security, the installer should be permanently disabled now.
                </p>
                <Button
                  variant="primary"
                  className="bg-danger-500 hover:bg-danger-600 border-none text-white w-full"
                  iconLeft={<Lock size={18} />}
                  onClick={handleDisable}
                >
                  Disable Installer & Go to Login
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
};
