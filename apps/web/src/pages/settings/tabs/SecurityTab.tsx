import React from 'react';
import { Shield, Smartphone, Monitor, LogOut, Key } from 'lucide-react';
import { Button, Card, Input, Badge } from '../../../design-system/components';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

export function SecurityTab() {
  const sessions = [
    { id: 1, device: 'Chrome on Windows', location: 'Delhi, IN', lastActive: 'Just now', started: 'May 7, 2025', isCurrent: true, icon: <Monitor size={20} /> },
    { id: 2, device: 'Safari on iPhone', location: 'Delhi, IN', lastActive: '2 hours ago', started: 'May 5, 2025', isCurrent: false, icon: <Smartphone size={20} /> },
    { id: 3, device: 'Firefox on macOS', location: 'Mumbai, IN', lastActive: '3 days ago', started: 'May 4, 2025', isCurrent: false, icon: <Monitor size={20} /> },
  ];

  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <section className="space-y-8">
        {/* Change Password */}
        <Card header={<h3 className="font-bold">Security & Password</h3>}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-surface-200 flex justify-end">
              <Button variant="primary" iconLeft={<Key size={18} />}>Update Password</Button>
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card 
          header={
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold">Active Sessions</h3>
              <Button variant="ghost" size="sm" iconLeft={<LogOut size={14} />}>Sign out all other devices</Button>
            </div>
          }
        >
          <div className="border border-surface-200 rounded-lg overflow-hidden">
            {sessions.map((session) => (
              <div key={session.id} className={styles.sessionItem}>
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionIcon}>{session.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{session.device}</span>
                      {session.isCurrent && <Badge variant="brand" size="sm">THIS DEVICE</Badge>}
                    </div>
                    <p className="text-xs text-hint mt-0.5">
                      {session.location} • Last active: {session.lastActive}
                    </p>
                    <p className="text-[10px] text-tertiary uppercase tracking-wider mt-1">
                      Started: {session.started}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="ghost" size="sm" className="text-danger-400">Sign out</Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Two Factor Auth Placeholder */}
        <Card className="bg-surface-100 border-dashed border-2">
          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold text-brand-600">Enhance your security</h4>
              <p className="text-sm text-muted">Two-factor authentication (2FA) is coming soon to all DirectorByte accounts.</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
