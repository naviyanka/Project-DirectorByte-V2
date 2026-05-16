import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  User as UserIcon, 
  CreditCard, 
  Folder, 
  Key, 
  LifeBuoy, 
  History,
  Ban,
  Play,
  Mail,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/auth.store';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/styles';
import styles from './Users.module.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
  { id: 'subscription', label: 'Subscription', icon: <CreditCard size={16} /> },
  { id: 'projects', label: 'Projects', icon: <Folder size={16} /> },
  { id: 'api-keys', label: 'API Keys', icon: <Key size={16} /> },
  { id: 'support', label: 'Support', icon: <LifeBuoy size={16} /> },
  { id: 'audit', label: 'Audit', icon: <History size={16} /> },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setToken, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['adminUser', id],
    queryFn: () => adminService.getUserDetails(id!),
    enabled: !!id,
  });

  const impersonateMutation = useMutation({
    mutationFn: () => adminService.impersonateUser(id!),
    onSuccess: async (data) => {
      setToken(data.token);
      await fetchUser();
      addToast({ title: 'Impersonation successful', message: `Now logged in as ${user?.email}`, type: 'success' });
      navigate('/home');
    },
    onError: (err: any) => {
      addToast({ title: 'Impersonation failed', message: err.message, type: 'error' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUser', id] });
      addToast({ title: 'User updated', type: 'success' });
    },
    onError: (err: any) => {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    }
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading user details...</div>;
  if (!user) return <div className="p-8 text-center">User not found.</div>;

  return (
    <div className={cn(styles.page, 'animate-fade-in')}>
      <header className="mb-8">
        <Link to="/admin/users" className="flex items-center gap-2 text-sm text-hint hover:text-warning-600 transition-colors mb-4 font-bold uppercase tracking-widest">
          <ArrowLeft size={16} />
          <span>Back to Users</span>
        </Link>
        
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-surface-900 text-warning-500 flex items-center justify-center text-3xl font-black uppercase">
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black">{user.name || 'Anonymous'}</h1>
                <Badge variant={user.emailVerified ? 'success' : 'warning'} size="sm">
                  {user.emailVerified ? 'ACTIVE' : 'UNVERIFIED'}
                </Badge>
              </div>
              <p className="text-sm text-hint font-medium">{user.email} · User ID: {id}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              iconLeft={<Play size={16} />} 
              onClick={() => impersonateMutation.mutate()}
              isLoading={impersonateMutation.isPending}
            >
              Impersonate
            </Button>
            <Button variant="outline" size="sm" iconLeft={<Ban size={16} />} className="text-danger-600 hover:bg-danger-50">Suspend</Button>
          </div>
        </div>
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

      <div className="max-w-4xl">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card header={<h3 className="font-bold">Profile Information</h3>}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Input label="Full Name" defaultValue={user.name} fullWidth />
                  <Input label="Email Address" defaultValue={user.email} fullWidth disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">Bio</label>
                  <textarea 
                    className="w-full bg-surface-50 border border-surface-200 rounded-lg p-3 text-sm min-h-[100px]"
                    defaultValue={user.bio}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" className="bg-warning-500 text-surface-950 border-none hover:bg-warning-400">Save Changes</Button>
                </div>
              </div>
            </Card>

            <Card header={<h3 className="font-bold">Account Actions</h3>}>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" fullWidth iconLeft={<Mail size={16} />}>Reset Password (Email)</Button>
                <Button variant="outline" fullWidth iconLeft={<Key size={16} />}>Set Password Directly</Button>
                <Button variant="outline" fullWidth iconLeft={<Mail size={16} />}>Send System Message</Button>
                <Button variant="outline" fullWidth iconLeft={<Trash2 size={16} />} className="text-danger-600 border-danger-100 hover:bg-danger-50">Delete Account</Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'subscription' && (
          <Card header={<h3 className="font-bold">Subscription Status</h3>}>
            <div className="space-y-8">
              <div className="flex justify-between items-center p-6 bg-surface-50 rounded-xl border border-surface-200">
                <div>
                  <div className="text-xs font-bold text-hint uppercase tracking-widest mb-1">Current Plan</div>
                  <div className="text-2xl font-black text-warning-600">{user.plan?.name || 'Free Plan'}</div>
                  <div className="text-xs text-secondary mt-1">
                    {user.subscription ? `${user.subscription.billingCycle} Billing · Renews ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}` : 'No active subscription'}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">Change Plan</Button>
                  <Button variant="outline" size="sm">Manage Credits</Button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-4">Payment History</h4>
                <div className="border border-surface-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="p-3 font-bold">Date</th>
                        <th className="p-3 font-bold">Amount</th>
                        <th className="p-3 font-bold">Status</th>
                        <th className="p-3 font-bold">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {user.payments?.map((p: any, i: number) => (
                        <tr key={i}>
                          <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-bold">${p.amount}</td>
                          <td className="p-3"><Badge variant={p.status === 'succeeded' ? 'success' : 'default'} size="sm">{p.status}</Badge></td>
                          <td className="p-3"><Button variant="ghost" size="sm" className="p-1 h-auto text-warning-600">Download</Button></td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-hint italic">No payment history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
