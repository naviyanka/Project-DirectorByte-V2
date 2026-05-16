import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Shield, UserPlus, Mail, Ban, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { cn } from '../../../utils/styles';
import styles from './Users.module.css';

export function UserListPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, page }],
    queryFn: () => adminService.getUsers({ search, page, perPage: 20 }),
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading users...</div>;

  const users = data?.items || [];

  return (
    <div className={cn(styles.page, 'animate-fade-in')}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">User Management</h1>
          <p className="text-sm text-hint mt-1">Manage platform users, plans, and access.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" iconLeft={<Download size={16} />}>Export CSV</Button>
          <Button variant="primary" size="sm" className="bg-warning-500 text-surface-950 hover:bg-warning-400 border-none" iconLeft={<UserPlus size={16} />}>Add User</Button>
        </div>
      </header>

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search by name, email, or user ID..." 
              fullWidth 
              leftIcon={<Search size={18} />} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" iconLeft={<Filter size={18} />}>Filters</Button>
        </div>
      </Card>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className="w-10"><input type="checkbox" className={styles.checkbox} /></th>
              <th>User</th>
              <th>Plan</th>
              <th>Storage</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr 
                key={user.id} 
                className={cn(selected.includes(user.id) && styles.selectedRow, "cursor-pointer")}
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className={styles.checkbox} 
                    checked={selected.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-xs uppercase">
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{user.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-hint font-medium">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={user.plan?.slug === 'studio' ? 'brand' : user.plan?.slug === 'creator' ? 'info' : 'default'}>
                    {user.plan?.name || 'Free'}
                  </Badge>
                </td>
                <td className="text-xs font-medium text-secondary">
                  {user.subscriptionUsage?.storageUsedBytes ? (parseInt(user.subscriptionUsage.storageUsedBytes) / (1024*1024*1024)).toFixed(1) + ' GB' : '0 GB'}
                </td>
                <td className="text-xs text-hint">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="text-xs text-hint">{user.lastLoginAt ? 'Recently' : 'Never'}</td>
                <td>
                  <Badge variant={user.emailVerified ? 'success' : 'warning'} size="sm">
                    {user.emailVerified ? 'Active' : 'Unverified'}
                  </Badge>
                </td>
                <td>
                  <button className="p-2 hover:bg-surface-100 rounded-lg text-hint">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className={styles.bulkActions}>
          <span className="text-xs font-bold text-surface-950 uppercase tracking-widest">{selected.length} Selected</span>
          <div className="flex gap-3 ml-8">
            <Button size="sm" variant="ghost" className="text-surface-950 hover:bg-surface-950/10" iconLeft={<Mail size={14} />}>Email</Button>
            <Button size="sm" variant="ghost" className="text-surface-950 hover:bg-surface-950/10" iconLeft={<Shield size={14} />}>Set Plan</Button>
            <Button size="sm" variant="ghost" className="text-danger-700 hover:bg-danger-50" iconLeft={<Ban size={14} />}>Suspend</Button>
          </div>
          <button className="ml-auto text-xs font-bold underline text-surface-950" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}
    </div>
  );
}
