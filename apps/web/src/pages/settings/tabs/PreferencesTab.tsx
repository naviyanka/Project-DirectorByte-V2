import React from 'react';
import { Sliders, Bell, Monitor, Globe, Clock, Save } from 'lucide-react';
import { Button, Card, Select, Toggle } from '../../../design-system/components';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

export function PreferencesTab() {
  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <section className="space-y-8">
        {/* Appearance */}
        <Card header={<h3 className="font-bold">Appearance</h3>}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-medium text-secondary flex items-center gap-2">
                  <Monitor size={16} /> Theme
                </label>
                <div className="flex p-1 bg-surface-200 rounded-lg">
                  <button className="flex-1 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm">Dark</button>
                  <button className="flex-1 py-1.5 text-xs font-bold rounded-md text-hint">Light</button>
                  <button className="flex-1 py-1.5 text-xs font-bold rounded-md text-hint">System</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-secondary flex items-center gap-2">
                  <Globe size={16} /> Language
                </label>
                <Select 
                  options={[
                    { label: 'English (US)', value: 'en-US' },
                    { label: 'Hindi (हिंदी)', value: 'hi-IN' },
                    { label: 'Spanish (Español)', value: 'es-ES' },
                  ]}
                  value="en-US"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Studio Defaults */}
        <Card header={<h3 className="font-bold">Studio Defaults</h3>}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Select 
                label="Default Export Resolution"
                options={[
                  { label: '1080p (Full HD)', value: '1080p' },
                  { label: '4K (Ultra HD)', value: '4k' },
                  { label: '720p (Standard)', value: '720p' },
                ]}
                value="1080p"
              />
              <Select 
                label="Auto-save Interval"
                options={[
                  { label: 'Every 30 seconds', value: '30s' },
                  { label: 'Every 1 minute', value: '1m' },
                  { label: 'Manual only', value: 'off' },
                ]}
                value="30s"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-secondary">Default Pipeline Stages</label>
              <div className="flex flex-wrap gap-3">
                {['Script', 'Storyboard', 'Keyframes', 'Video', 'Audio', 'Assembly'].map(stage => (
                  <label key={stage} className="flex items-center gap-2 px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg cursor-pointer hover:bg-surface-200 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-500 border-surface-300 focus:ring-brand-400" />
                    <span className="text-sm font-medium">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card header={<h3 className="font-bold">Email Notifications</h3>}>
          <div className="space-y-4">
            {[
              { label: 'Generation complete', desc: 'Get notified when your video or audio generation finishes.' },
              { label: 'Billing and subscription', desc: 'Invoices, payment reminders, and plan updates.' },
              { label: 'Product announcements', desc: 'New features, improvements, and news.' },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-100 rounded-lg border border-surface-200">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">{n.label}</p>
                  <p className="text-xs text-hint">{n.desc}</p>
                </div>
                <Toggle checked={true} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="primary" size="lg" iconLeft={<Save size={18} />}>Save Preferences</Button>
        </div>
      </section>
    </div>
  );
}
