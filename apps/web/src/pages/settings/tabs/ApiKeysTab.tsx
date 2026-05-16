import React, { useState } from 'react';
import { Key, ExternalLink, Sparkles, Check, X, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Badge, Select } from '../../../design-system/components';
import { useAuthStore } from '../../../store/auth.store';
import { apiKeysService, ApiKey } from '../../../services/apiKeys.service';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

interface ModuleCardProps {
  module: string;
  title: string;
  icon: React.ReactNode;
  providers: { label: string; value: string }[];
  existingKey?: ApiKey;
  isManaged?: boolean;
}

function ModuleKeyCard({ 
  module,
  title, 
  icon, 
  providers, 
  existingKey,
  isManaged 
}: ModuleCardProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(existingKey?.provider || providers[0].value);

  const saveMutation = useMutation({
    mutationFn: (key: string) => apiKeysService.saveKey({ module, provider: selectedProvider, key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setIsEditing(false);
      setNewKey('');
      addToast({ title: 'API Key saved', type: 'success' });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to save key', message: err.message, type: 'error' });
    }
  });

  const testMutation = useMutation({
    mutationFn: () => apiKeysService.testKey(existingKey!.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      if (res.success) {
        addToast({ title: 'Connection successful', type: 'success' });
      } else {
        addToast({ title: 'Connection failed', message: res.message, type: 'error' });
      }
    }
  });

  const status = existingKey 
    ? (existingKey.lastTestStatus === 'error' ? 'ERROR' : 'CONNECTED') 
    : 'MISSING';

  return (
    <Card className="relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-200 rounded-lg text-brand-400">{icon}</div>
          <h4 className="font-bold">{title}</h4>
        </div>
        <Badge variant={status === 'CONNECTED' ? 'success' : status === 'ERROR' ? 'danger' : 'default'}>
          {status === 'CONNECTED' ? 'Connected' : status === 'ERROR' ? 'Invalid Key' : 'Key Required'}
        </Badge>
      </div>

      {isManaged ? (
        <div className={styles.managedNotice}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} />
            <span className="font-bold text-sm">DirectorByte Managed</span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            Your plan includes managed keys for this module. You don't need to provide your own.
          </p>
          <Button variant="ghost" size="sm" className="mt-4 text-white hover:bg-white/10 p-0 text-xs underline">
            Use my own key instead
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Select 
            label="Provider"
            options={providers}
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            size="sm"
            disabled={isEditing && saveMutation.isPending}
          />

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-hint">API Key</label>
            {isEditing || !existingKey ? (
              <div className="flex gap-2">
                <Input 
                  type={showKey ? 'text' : 'password'} 
                  placeholder="Paste your key here" 
                  fullWidth
                  className="h-9 py-0"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => saveMutation.mutate(newKey)}
                  isLoading={saveMutation.isPending}
                  disabled={!newKey}
                >
                  Save
                </Button>
                {existingKey && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-surface-200 rounded-md border border-surface-300">
                <code className="text-xs">{showKey ? (existingKey.keyHint ? `${existingKey.keyHint}....` : '••••••••••••') : '••••••••••••'}</code>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowKey(!showKey)} className="p-1 hover:text-brand-400">
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setIsEditing(true)} className="p-1 hover:text-brand-400">
                    <RefreshCcw size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {existingKey && (
            <div className="pt-4 border-t border-surface-200 flex justify-between items-center">
              <span className="text-[10px] text-tertiary">
                {existingKey.lastTestedAt ? `Last tested: ${new Date(existingKey.lastTestedAt).toLocaleString()}` : 'Not tested yet'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={() => testMutation.mutate()}
                isLoading={testMutation.isPending}
              >
                Test Connection
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ApiKeysTab() {
  const { user } = useAuthStore();
  const isPaid = user?.plan !== 'FREE';

  const { data: keys, isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => apiKeysService.getKeys(),
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading API keys...</div>;

  const getKeyForModule = (mod: string) => keys?.find(k => k.module === mod);

  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <header className="mb-8">
        <h3 className="text-xl font-bold mb-2">API Key Manager</h3>
        <p className="text-muted text-sm leading-relaxed">
          Configure which AI providers power each feature. 
          Free plan users must provide their own keys. 
          Creator plan users use our managed keys by default.
        </p>
        <Button variant="ghost" size="sm" iconRight={<ExternalLink size={14} />} className="mt-2 text-brand-400 p-0 h-auto">
          How to get API keys
        </Button>
      </header>

      <div className="space-y-12">
        <section className="space-y-6">
          <h5 className="text-xs font-bold uppercase tracking-widest text-hint">Language & Script</h5>
          <div className={styles.cardGrid}>
            <ModuleKeyCard 
              module="CHAT"
              title="Director Assistant (Chat)"
              icon={<Sparkles size={20} />}
              providers={[{ label: 'OpenAI GPT-4o', value: 'openai' }, { label: 'Anthropic Claude 3.5', value: 'anthropic' }]}
              existingKey={getKeyForModule('CHAT')}
              isManaged={isPaid}
            />
            <ModuleKeyCard 
              module="SCRIPT"
              title="Script Generation"
              icon={<Key size={20} />}
              providers={[{ label: 'Gemini 1.5 Pro', value: 'google' }, { label: 'Mistral Large', value: 'mistral' }]}
              existingKey={getKeyForModule('SCRIPT')}
              isManaged={isPaid}
            />
          </div>
        </section>

        <section className="space-y-6">
          <h5 className="text-xs font-bold uppercase tracking-widest text-hint">Visual & Video</h5>
          <div className={styles.cardGrid}>
            <ModuleKeyCard 
              module="IMAGE_GEN"
              title="Storyboard / Keyframes"
              icon={<Sparkles size={20} />}
              providers={[{ label: 'Flux.1 Pro', value: 'flux' }, { label: 'Midjourney v6', value: 'midjourney' }]}
              existingKey={getKeyForModule('IMAGE_GEN')}
            />
            <ModuleKeyCard 
              module="VIDEO_GEN"
              title="Video Generation"
              icon={<Key size={20} />}
              providers={[{ label: 'Runway Gen-3', value: 'runwayml' }, { label: 'Luma Dream Machine', value: 'luma' }]}
              existingKey={getKeyForModule('VIDEO_GEN')}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
