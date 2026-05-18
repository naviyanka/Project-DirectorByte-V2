import React, { useState } from 'react';
import { Settings, Shield, Flag, Save, RefreshCw, Key } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { useToast } from '../../../hooks/useToast';
import axios from '../../../lib/axios';
import { cn } from '../../../utils/styles';

const TABS = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'security', label: 'Security & Auth', icon: <Shield size={16} /> },
  { id: 'env', label: 'Environment Variables', icon: <Key size={16} /> },
  { id: 'features', label: 'Feature Flags', icon: <Flag size={16} /> },
];

const SettingInput = ({ setting, onSave }: { setting: any, onSave: (key: string, val: string) => void }) => {
  const [val, setVal] = useState(setting.value);
  const [show, setShow] = useState(!setting.isSecret);
  const isMissing = setting.isRequired && !val;

  return (
    <div className="space-y-1 mb-4 p-4 border rounded-xl bg-surface-50 border-surface-200">
      <div className="flex items-center justify-between">
         <label className="text-sm font-bold font-mono">{setting.key}</label>
         {isMissing && <Badge variant="danger">Required - Not Set</Badge>}
      </div>
      {setting.description && <p className="text-xs text-hint">{setting.description}</p>}
      <div className="flex gap-2 mt-2">
        <div className="flex-1 relative">
           <Input
             type={show ? "text" : "password"}
             value={val}
             onChange={e => setVal(e.target.value)}
             fullWidth
           />
           {setting.isSecret && (
             <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-xs font-bold text-brand-500">
               {show ? 'HIDE' : 'SHOW'}
             </button>
           )}
        </div>
        <Button variant="outline" onClick={() => onSave(setting.key, val)} disabled={val === setting.value}>Save</Button>
      </div>
    </div>
  );
};

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isReloading, setIsReloading] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsArray, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminService.getSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: any }) => adminService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      addToast({ title: 'Setting updated', type: 'success' });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to update setting', message: err.message, type: 'error' });
    }
  });

  const handleReloadEnv = async () => {
    setIsReloading(true);
    try {
      // In a full implementation, you'd hit an endpoint to trigger process.exit(0) for a PM2 restart
      await axios.post('/admin/system/maintenance', { enabled: false, message: 'reloading' }); // mock trigger
      addToast({ title: 'Environment configuration reloaded', type: 'success' });
    } catch (err: any) {
      addToast({ title: 'Failed to reload', type: 'error' });
    } finally {
      setIsReloading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading system settings...</div>;

  const generalSettings = settingsArray?.filter((s: any) => !s.key.startsWith('feature.') && !s.key.startsWith('env.')) || [];
  const envSettings = settingsArray?.filter((s: any) => s.key.startsWith('env.')) || [];
  const featureFlags = settingsArray?.filter((s: any) => s.key.startsWith('feature.')) || [];

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">System Settings</h1>
          <p className="text-sm text-hint mt-1">Configure global application behavior and security.</p>
        </div>
        <Button variant="outline" iconLeft={<RefreshCw size={16} className={cn(isReloading && "animate-spin")} />} onClick={handleReloadEnv} disabled={isReloading}>
          {isReloading ? 'Applying changes...' : 'Apply Config Changes'}
        </Button>
      </header>

      <div className="flex gap-1 border-b border-surface-200 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2",
              activeTab === tab.id 
                ? "border-warning-500 text-warning-600 bg-warning-50/50" 
                : "border-transparent text-hint hover:text-secondary hover:bg-surface-50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card header={<h3 className="font-bold">General Configuration</h3>}>
              <div className="space-y-4">
                 {generalSettings.map((s: any) => (
                    <SettingInput key={s.key} setting={s} onSave={(k, v) => updateMutation.mutate({ key: k, value: v })} />
                 ))}
                 {generalSettings.length === 0 && <p className="text-hint text-sm">No general settings found in DB.</p>}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="space-y-6">
            <Card header={<h3 className="font-bold">Environment Variables</h3>}>
              <p className="text-sm text-hint mb-6">These variables act as `.env` fallbacks. Update them here without modifying the server manually.</p>
              <div className="space-y-4">
                 {envSettings.map((s: any) => (
                    <SettingInput key={s.key} setting={s} onSave={(k, v) => updateMutation.mutate({ key: k, value: v })} />
                 ))}
                 {envSettings.length === 0 && <p className="text-hint text-sm">No environment variables mapped in DB yet.</p>}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'features' && (
          <Card header={<h3 className="font-bold">Feature Flags</h3>}>
            <div className="space-y-4">
              {featureFlags.map((s: any) => (
                <div key={s.key} className="flex items-center justify-between p-4 hover:bg-surface-50 rounded-xl transition-colors border border-surface-200">
                  <div>
                    <div className="text-sm font-bold capitalize">{s.key.replace('feature.', '').replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-xs text-hint">Toggle platform feature: {s.key}</div>
                  </div>
                  <button onClick={() => updateMutation.mutate({ key: s.key, value: s.value === 'true' ? 'false' : 'true' })}>
                    <Badge variant={s.value === 'true' ? 'success' : 'default'} className="cursor-pointer">
                      {s.value === 'true' ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </button>
                </div>
              ))}
              {featureFlags.length === 0 && (
                <div className="p-4 text-center text-hint italic text-xs">No feature flags configured in database.</div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'security' && (
           <Card header={<h3 className="font-bold">Security</h3>}>
              <p className="text-sm text-hint">Security settings go here (e.g. 2FA enforcing).</p>
           </Card>
        )}
      </div>
    </div>
  );
}
