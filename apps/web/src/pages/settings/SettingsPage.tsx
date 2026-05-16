import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Link as LinkIcon, 
  Key, 
  HardDrive, 
  Sliders, 
  CreditCard, 
  History, 
  Trash2 
} from 'lucide-react';
import { cn } from '../../utils/styles';
import { ProfileTab } from './tabs/ProfileTab';
import { SecurityTab } from './tabs/SecurityTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { StorageTab } from './tabs/StorageTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { SubscriptionTab } from './tabs/SubscriptionTab';
import styles from './SettingsPage.module.css';

const NAV_GROUPS = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: <User size={18} />, path: 'profile' },
      { id: 'security', label: 'Security', icon: <Shield size={18} />, path: 'security' },
      { id: 'connected', label: 'Connected Accounts', icon: <LinkIcon size={18} />, path: 'connected' },
    ]
  },
  {
    label: 'AI Configuration',
    items: [
      { id: 'api-keys', label: 'API Keys', icon: <Key size={18} />, path: 'api-keys' },
    ]
  },
  {
    label: 'Workspace',
    items: [
      { id: 'storage', label: 'Storage', icon: <HardDrive size={18} />, path: 'storage' },
      { id: 'preferences', label: 'Preferences', icon: <Sliders size={18} />, path: 'preferences' },
    ]
  },
  {
    label: 'Billing',
    items: [
      { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} />, path: 'subscription' },
      { id: 'billing', label: 'Billing History', icon: <History size={18} />, path: 'billing' },
    ]
  },
  {
    label: 'Danger Zone',
    items: [
      { id: 'delete', label: 'Delete Account', icon: <Trash2 size={18} />, path: 'delete', variant: 'danger' },
    ]
  }
];

export function SettingsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account, AI providers, and workspace preferences.</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className={styles.group}>
                <span className={styles.groupLabel}>{group.label}</span>
                <div className={styles.groupItems}>
                  {group.items.map((item: any) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) => cn(
                        styles.navItem,
                        isActive && styles.active,
                        item.variant === 'danger' && styles.danger
                      )}
                    >
                      <span className={styles.icon}>{item.icon}</span>
                      <span className={styles.label}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="security" element={<SecurityTab />} />
            <Route path="api-keys" element={<ApiKeysTab />} />
            <Route path="storage" element={<StorageTab />} />
            <Route path="preferences" element={<PreferencesTab />} />
            <Route path="subscription" element={<SubscriptionTab />} />
            <Route path="*" element={<div className="p-12 text-center text-muted">Feature coming soon</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
