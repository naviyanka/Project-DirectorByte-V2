import React from 'react';
import { Check, Sparkles, TrendingUp, History, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, ProgressBar, Input } from '../../../design-system/components';
import { billingService } from '../../../services/billing.service';
import { projectsService } from '../../../services/projects.service';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

export function SubscriptionTab() {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingService.getSubscription(),
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usageStats'],
    queryFn: () => projectsService.getUsageStats(),
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingService.getPlans(),
  });

  const handleManageBilling = async () => {
    try {
      const { portalUrl } = await billingService.createPortalSession();
      window.location.href = portalUrl;
    } catch (err: any) {
      addToast({ title: 'Portal error', message: err.message, type: 'error' });
    }
  };

  if (subLoading || usageLoading) return <div className="p-8 text-center animate-pulse">Loading billing details...</div>;

  const currentPlan = plans?.find(p => p.id === subscription?.planId);
  const nextRenews = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A';
  
  const formatBytes = (bytes: string | number) => {
    const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercent = (used: number | string, total: number | string) => {
    const u = typeof used === 'string' ? parseInt(used) : used;
    const t = typeof total === 'string' ? parseInt(total) : total;
    if (t === 0) return 0;
    return Math.round((u / t) * 100);
  };

  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <section className="space-y-8">
        {/* Current Plan */}
        <Card header={<h3 className="font-bold">Your Plan</h3>}>
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{currentPlan?.name || 'Free Plan'}</h4>
                    <p className="text-sm text-hint">
                      {subscription?.status === 'CANCELED' ? 'Ends on' : 'Renews on'} {nextRenews}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {currentPlan ? `$${subscription?.billingCycle === 'ANNUAL' ? currentPlan.priceAnnual : currentPlan.priceMonthly}` : '$0.00'}
                  <span className="text-sm font-normal text-hint"> / {subscription?.billingCycle?.toLowerCase() || 'month'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button 
                  variant="primary" 
                  iconLeft={<TrendingUp size={16} />}
                  onClick={() => window.location.href = '/subscription/pricing'}
                >
                  Change Plan
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-hint text-xs"
                  onClick={handleManageBilling}
                >
                  Manage billing or cancel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-surface-200">
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-widest text-hint">What's included</h5>
                <ul className="space-y-3">
                  {(currentPlan?.features as any[] || []).filter(f => f.included).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-secondary">
                      <div className="w-5 h-5 rounded-full bg-success-50 flex items-center justify-center text-success-500">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <h5 className="text-xs font-bold uppercase tracking-widest text-hint">Usage this period</h5>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Credits</span>
                      <span className="text-brand-600">{usage?.credits?.used || 0} / {usage?.credits?.total || 0}</span>
                    </div>
                    <ProgressBar value={getPercent(usage?.credits?.used || 0, usage?.credits?.total || 1)} size="sm" variant="brand" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Storage</span>
                      <span>{formatBytes(usage?.storage?.used || 0)} / {formatBytes(usage?.storage?.total || 0)}</span>
                    </div>
                    <ProgressBar value={getPercent(usage?.storage?.used || 0, usage?.storage?.total || 1)} size="sm" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Exports</span>
                      <span>{usage?.exports?.used || 0} / {usage?.exports?.total || 0}</span>
                    </div>
                    <ProgressBar value={getPercent(usage?.exports?.used || 0, usage?.exports?.total || 1)} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Promo Code */}
        <Card header={<h3 className="font-bold">Promo Code</h3>}>
          <div className="flex gap-4">
            <Input placeholder="Enter code" fullWidth />
            <Button variant="outline">Apply</Button>
          </div>
        </Card>

        {/* Billing History Link */}
        <div className="flex justify-between items-center p-6 bg-surface-100 rounded-xl border border-surface-200">
          <div className="flex items-center gap-3">
            <History className="text-hint" />
            <div>
              <h4 className="font-bold text-sm">Stripe Customer Portal</h4>
              <p className="text-xs text-hint">Securely manage your payment methods and view invoice history.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleManageBilling} iconRight={<ExternalLink size={14} />}>Open Portal</Button>
        </div>
      </section>
    </div>
  );
}
