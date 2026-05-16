import React from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Ticket, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Send,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { cn } from '../../../utils/styles';
import styles from './Overview.module.css';

export function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: () => adminService.getOverviewStats(),
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading platform metrics...</div>;

  const KPIS = [
    { label: 'Total Users', value: stats?.users?.total || '0', trend: `+${stats?.users?.today || 0} today`, up: true, icon: <Users size={20} /> },
    { label: 'Active (24h)', value: stats?.users?.active24h || '0', trend: `${stats?.users?.activeMoM || 0}% MoM`, up: (stats?.users?.activeMoM || 0) >= 0, icon: <TrendingUp size={20} /> },
    { label: 'MRR', value: stats?.revenue?.mrr ? `$${stats.revenue.mrr.toLocaleString()}` : '$0', trend: `+$${stats?.revenue?.mrrDiff || 0} MoM`, up: true, icon: <CreditCard size={20} /> },
    { label: 'Open Tickets', value: stats?.support?.openCount || '0', trend: `${stats?.support?.urgentCount || 0} urgent`, up: false, icon: <Ticket size={20} /> },
  ];

  return (
    <div className={cn(styles.page, 'animate-fade-in')}>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black">Admin Overview</h1>
          <p className="text-sm text-hint mt-1">Real-time platform metrics and activity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" iconLeft={<Plus size={16} />}>Promo Code</Button>
          <Button variant="outline" size="sm" iconLeft={<Send size={16} />}>Announcement</Button>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className={styles.kpiCard}>
            <div className="flex justify-between items-start mb-4">
              <div className={styles.kpiIcon}>{kpi.icon}</div>
              <div className={cn(styles.trend, kpi.up ? styles.trendUp : styles.trendDown)}>
                {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{kpi.trend}</span>
              </div>
            </div>
            <div className="text-3xl font-black mb-1">{kpi.value}</div>
            <div className="text-xs font-bold text-hint uppercase tracking-widest">{kpi.label}</div>
          </Card>
        ))}
      </section>

      <div className={styles.mainGrid}>
        {/* Charts Section */}
        <div className="space-y-6">
          <Card header={<h3 className="font-bold">Growth & Revenue</h3>} className="h-full min-h-[400px]">
            <div className="flex items-center justify-center h-full text-hint italic">
              Chart implementation (User growth vs MRR) - Real data: {stats?.revenue?.history?.length || 0} periods fetched.
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card header={<h3 className="font-bold">Recent Activity</h3>}>
            <div className="space-y-4">
              {stats?.recentActivity?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-surface-100 last:border-0">
                  <span className="text-lg">{item.icon || '🔵'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate max-w-[180px]">
                      {item.type} <span className="text-hint font-normal">· {item.user}</span>
                    </p>
                    <p className="text-[10px] text-hint uppercase tracking-wider font-bold mt-0.5">{item.time || 'just now'}</p>
                  </div>
                  <ArrowRight size={14} className="text-surface-300" />
                </div>
              )) || <div className="p-4 text-center text-hint text-xs">No recent activity</div>}
              <Button variant="ghost" fullWidth size="sm" className="mt-2 text-xs">View all activity</Button>
            </div>
          </Card>

          <Card header={<h3 className="font-bold">System Health</h3>}>
            <div className="space-y-4">
              <div className="p-3 bg-success-50 text-success-700 rounded-lg border border-success-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-xs font-bold">All systems operational</span>
              </div>
              <div className="space-y-2">
                {stats?.health?.services?.map((s: any) => (
                  <div key={s.name} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-hint">{s.name}</span>
                    <span className="text-secondary">{s.status}</span>
                  </div>
                )) || (
                  ['API', 'Video Gen', 'Payments'].map(name => (
                    <div key={name} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-hint">{name}</span>
                      <span className="text-secondary">100%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
