import React, { useState } from 'react';
import { Settings, Shield, Flag, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/styles';

const TABS = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'features', label: 'Feature Flags', icon: <Flag size={16} /> },
];

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading system settings...</div>;

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-black">System Settings</h1>
        <p className="text-sm text-hint mt-1">Configure global application behavior and security.</p>
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
              <div className="space-y-6">
                <Input 
                  label="Application Name" 
                  defaultValue={settings?.general?.appName || "DirectorByte v2"} 
                  fullWidth 
                />
                <Input 
                  label="Support Email" 
                  defaultValue={settings?.general?.supportEmail || "support@directorbyte.com"} 
                  fullWidth 
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">System-wide Maintenance Mode</label>
                  <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg border border-surface-200">
                    <div>
                      <div className="text-sm font-bold">Maintenance Mode</div>
                      <div className="text-xs text-hint">Redirects all users to a maintenance page</div>
                    </div>
                    <button 
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        settings?.general?.maintenanceMode ? "bg-danger-500" : "bg-surface-300"
                      )}
                      onClick={() => updateMutation.mutate({ key: 'general.maintenanceMode', value: !settings?.general?.maintenanceMode })}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        settings?.general?.maintenanceMode ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'features' && (
          <Card header={<h3 className="font-bold">Feature Flags</h3>}>
            <div className="space-y-4">
              {Object.entries(settings?.features || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-4 hover:bg-surface-50 rounded-xl transition-colors">
                  <div>
                    <div className="text-sm font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-xs text-hint">Toggle platform feature: {key}</div>
                  </div>
                  <button onClick={() => updateMutation.mutate({ key: `features.${key}`, value: !value })}>
                    <Badge variant={value ? 'success' : 'default'} className="cursor-pointer">
                      {value ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </button>
                </div>
              ))}
              {!settings?.features && (
                <div className="p-4 text-center text-hint italic text-xs">No feature flags configured in database.</div>
              )}
            </div>
          </Card>
        )}

        <div className="mt-8 flex justify-end">
          <Button variant="primary" className="bg-warning-500 text-surface-950 border-none hover:bg-warning-400" iconLeft={<Save size={18} />}>
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
