import React from 'react';
import { Plus, Edit2, Archive, CheckCircle2, Globe } from 'lucide-react';
import { Button, Card, Badge } from '../../../design-system/components';
import { cn } from '../../../utils/styles';
import styles from '../Users/Users.module.css';

const MOCK_PLANS = [
  { id: 'p1', name: 'Free', price: '$0', subs: '4,415', status: 'Active', public: true },
  { id: 'p2', name: 'Creator', price: '$19/mo', subs: '280', status: 'Active', public: true, featured: true },
  { id: 'p3', name: 'Studio', price: '$49/mo', subs: '132', status: 'Active', public: true },
];

export function PlanListPage() {
  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">Plan Configuration</h1>
          <p className="text-sm text-hint mt-1">Manage public plans, pricing, and resource limits.</p>
        </div>
        <Button variant="primary" className="bg-warning-500 text-surface-950 hover:bg-warning-400 border-none" iconLeft={<Plus size={16} />}>Create New Plan</Button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Price</th>
              <th>Subscribers</th>
              <th>Status</th>
              <th>Public</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PLANS.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{plan.name}</span>
                    {plan.featured && <span className="text-xs">⭐</span>}
                  </div>
                </td>
                <td className="text-sm font-black text-secondary">{plan.price}</td>
                <td className="text-sm font-medium text-hint">{plan.subs}</td>
                <td>
                  <Badge variant="success" size="sm">{plan.status}</Badge>
                </td>
                <td>
                  {plan.public ? (
                    <div className="flex items-center gap-1.5 text-success-600 text-[10px] font-bold uppercase">
                      <Globe size={12} />
                      <span>Public</span>
                    </div>
                  ) : (
                    <span className="text-hint text-[10px] font-bold uppercase">Private</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" iconLeft={<Edit2 size={14} />}>Edit</Button>
                    <Button variant="ghost" size="sm" iconLeft={<Archive size={14} />} className="text-danger-600">Archive</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
