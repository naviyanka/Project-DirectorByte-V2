import React, { useState } from 'react';
import { Search, Filter, User, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { cn } from '../../../utils/styles';
import styles from '../Users/Users.module.css';

export function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs', { search, page }],
    queryFn: () => adminService.getAuditLogs({ search, page, perPage: 50 }),
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Badge variant="danger">Critical</Badge>;
      case 'HIGH': return <Badge variant="warning">High</Badge>;
      default: return <Badge variant="info">Normal</Badge>;
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading audit logs...</div>;

  const logs = data?.items || [];

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">Audit Log</h1>
          <p className="text-sm text-hint mt-1">Immutable record of all administrative actions.</p>
        </div>
        <Button variant="outline" size="sm" iconLeft={<AlertCircle size={16} />}>Security Report</Button>
      </header>

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search logs by admin, action, or target..." 
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
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP Address</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td className="text-xs text-hint">{new Date(log.createdAt).toLocaleString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-hint" />
                    <span className="font-bold text-sm">{log.admin?.name || log.adminEmail || 'System'}</span>
                  </div>
                </td>
                <td>
                  <code className="text-[10px] font-black bg-surface-100 px-1.5 py-0.5 rounded text-secondary">
                    {log.action}
                  </code>
                </td>
                <td className="text-xs font-medium text-secondary truncate max-w-[200px]">{log.target}</td>
                <td className="text-[10px] font-bold text-hint font-mono">{log.ip}</td>
                <td>{getSeverityBadge(log.severity)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-hint italic">No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
