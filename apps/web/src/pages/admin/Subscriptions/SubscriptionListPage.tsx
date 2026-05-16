import React, { useState } from 'react';
import { Search, Download, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { cn } from '../../../utils/styles';
import styles from '../Users/Users.module.css';

export function SubscriptionListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminSubscriptions', { search, page }],
    queryFn: () => adminService.getSubscriptions({ search, page, perPage: 20 }),
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading subscriptions...</div>;

  const subscriptions = data?.items || [];

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">Subscription Management</h1>
          <p className="text-sm text-hint mt-1">{data?.totalActive || 0} active subscriptions · ${data?.mrr?.toLocaleString() || 0} MRR</p>
        </div>
        <Button variant="outline" size="sm" iconLeft={<Download size={16} />}>Export Revenue Report</Button>
      </header>

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search by user or email..." 
              fullWidth 
              leftIcon={<Search size={18} />} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Status: All</Button>
            <Button variant="outline" size="sm">Plan: All</Button>
          </div>
        </div>
      </Card>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Billing</th>
              <th>Period End</th>
              <th>MRR</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub: any) => (
              <tr key={sub.id}>
                <td>
                  <div className="font-bold text-sm">{sub.user?.name || 'Anonymous'}</div>
                  <div className="text-[10px] text-hint font-medium">{sub.user?.email}</div>
                </td>
                <td>
                  <Badge variant={sub.plan?.slug === 'studio' ? 'brand' : 'info'}>{sub.plan?.name}</Badge>
                </td>
                <td>
                  <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {sub.status}
                  </Badge>
                </td>
                <td className="text-xs font-medium text-secondary capitalize">{sub.billingCycle?.toLowerCase()}</td>
                <td className="text-xs text-hint">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                <td className="text-xs font-black text-secondary">
                  ${sub.billingCycle === 'ANNUAL' ? (sub.plan?.priceAnnual / 12).toFixed(2) : sub.plan?.priceMonthly}
                </td>
                <td>
                  <button className="p-2 hover:bg-surface-100 rounded-lg text-hint">
                    <ArrowUpRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-hint italic">No subscriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
