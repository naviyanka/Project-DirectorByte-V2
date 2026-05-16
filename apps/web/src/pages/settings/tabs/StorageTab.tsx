import React from 'react';
import { Cloud, ExternalLink, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ProgressBar, Badge } from '../../../design-system/components';
import { storageService } from '../../../services/storage.service';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

export function StorageTab() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['storageStatus'],
    queryFn: () => storageService.getStatus(),
  });

  const setProviderMutation = useMutation({
    mutationFn: (provider: 'LOCAL' | 'GOOGLE_DRIVE') => storageService.setProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageStatus'] });
      addToast({ title: 'Storage provider updated', type: 'success' });
    },
    onError: (err: any) => {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    }
  });

  const handleConnectDrive = async () => {
    try {
      const { authUrl } = await storageService.getGoogleDriveConnectUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to initiate Drive connection.', type: 'error' });
    }
  };

  const formatBytes = (bytes: string | number | undefined) => {
    if (!bytes) return '0 B';
    const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading storage status...</div>;

  const usedBytes = parseInt(status?.usage?.usedByAppBytes || '0');
  const limitBytes = parseInt(status?.usage?.limitBytes || '0');
  const percent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <section className="space-y-8">
        {/* Primary Storage Selection */}
        <Card header={<h3 className="font-bold">Primary Storage</h3>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local / Cloud Storage */}
            <div 
              onClick={() => setProviderMutation.mutate('LOCAL')}
              className={cn(
                "p-6 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden",
                status?.provider === 'LOCAL' ? "border-brand-500 bg-brand-50/5 shadow-lg shadow-brand-500/10" : "border-surface-200 hover:border-surface-300"
              )}
            >
              {status?.provider === 'LOCAL' && <CheckCircle2 className="absolute top-4 right-4 text-brand-500" size={20} />}
              <div className="flex items-center gap-3 mb-4">
                <Cloud className={status?.provider === 'LOCAL' ? "text-brand-500" : "text-hint"} />
                <span className="font-bold">DirectorByte Cloud</span>
              </div>
              <p className="text-xs text-secondary mb-4 leading-relaxed">Fast, managed storage included in your plan. High performance for real-time studio work.</p>
              <ProgressBar value={percent} size="sm" variant={percent > 90 ? 'danger' : 'brand'} className="mb-2" />
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-secondary">{formatBytes(usedBytes)} of {formatBytes(limitBytes)}</span>
                <span className={percent > 90 ? "text-danger-500" : "text-brand-500"}>{percent}%</span>
              </div>
            </div>

            {/* Google Drive */}
            <div 
              onClick={() => status?.connected && setProviderMutation.mutate('GOOGLE_DRIVE')}
              className={cn(
                "p-6 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden",
                status?.provider === 'GOOGLE_DRIVE' ? "border-brand-500 bg-brand-50/5 shadow-lg shadow-brand-500/10" : "border-surface-200 hover:border-surface-300",
                !status?.connected && "opacity-80"
              )}
            >
              {status?.provider === 'GOOGLE_DRIVE' && <CheckCircle2 className="absolute top-4 right-4 text-brand-500" size={20} />}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-surface-200 rounded-sm flex items-center justify-center p-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-full h-full" />
                </div>
                <span className="font-bold">Google Drive</span>
                {status?.connected ? <Badge variant="success">Connected</Badge> : <Badge variant="default">Disconnected</Badge>}
              </div>
              
              {!status?.connected ? (
                <>
                  <p className="text-xs text-muted mb-4 leading-relaxed">Connect your own Google Drive to bypass platform storage limits and keep your files locally synced.</p>
                  <Button variant="primary" size="sm" fullWidth onClick={(e) => { e.stopPropagation(); handleConnectDrive(); }} iconRight={<ExternalLink size={14} />}>Connect Google Drive</Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-secondary mb-4 leading-relaxed">Your files are being mirrored to your Google Drive in the <code>/DirectorByte</code> folder.</p>
                  {status.drive && !status.drive.error ? (
                    <div className="space-y-2">
                      <ProgressBar value={Math.round((status.drive.usedBytes / status.drive.quotaBytes) * 100)} size="sm" variant="success" />
                      <div className="flex justify-between text-[10px] font-bold text-hint uppercase">
                        <span>{formatBytes(status.drive.usedBytes)} of {formatBytes(status.drive.quotaBytes)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-danger-50 text-danger-600 text-[10px] rounded border border-danger-100 font-bold">
                      {status?.drive?.error || 'Token expired. Reconnect Drive.'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Sync Status */}
        {status?.connected && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className={cn("text-brand-400", setProviderMutation.isPending && "animate-spin")} size={18} />
                <div>
                  <div className="text-sm font-bold">Live Sync Active</div>
                  <div className="text-xs text-hint">Last synced {status.drive?.lastSyncedAt ? new Date(status.drive.lastSyncedAt).toLocaleString() : 'just now'}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>Sync Now</Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
