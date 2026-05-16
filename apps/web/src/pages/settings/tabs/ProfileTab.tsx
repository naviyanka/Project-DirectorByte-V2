import React, { useState } from 'react';
import { Camera, User, Mail, Save, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { Button, Card, Input, Badge } from '../../../design-system/components';
import { cn } from '../../../utils/styles';
import styles from './Tabs.module.css';

export function ProfileTab() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const isDirty = displayName !== (user?.name || '') || bio !== '';

  return (
    <div className={cn(styles.tabContent, 'animate-fade-in')}>
      <section className="space-y-8">
        {/* Avatar Section */}
        <Card>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className={styles.avatarWrapper}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.name?.charAt(0) || <User size={40} />}
                </div>
              )}
              <button className={styles.avatarOverlay} title="Change photo">
                <Camera size={20} />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-xl font-bold">{user?.name}</h3>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Badge variant="brand">{user?.plan || 'FREE'}</Badge>
                  <span className="text-xs text-hint italic">Member since May 2025</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Button variant="outline" size="sm" iconLeft={<Camera size={14} />}>Change Photo</Button>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card header={<h3 className="font-bold">Personal Information</h3>}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                placeholder="How you appear to others"
                maxLength={50}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">Email Address</label>
                <div className="flex gap-2">
                  <Input
                    value={user?.email || ''}
                    disabled
                    fullWidth
                    leftIcon={<Mail size={16} />}
                  />
                  <Button variant="outline" iconLeft={<ExternalLink size={16} />} title="Change Email" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Bio</label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={300}
              />
              <div className="text-right text-[10px] font-bold text-hint uppercase tracking-wider">
                {bio.length} / 300 characters
              </div>
            </div>

            <div className="pt-4 border-t border-surface-200 flex justify-end">
              <Button 
                variant="primary" 
                size="lg" 
                iconLeft={<Save size={18} />}
                disabled={!isDirty || isSaving}
                isLoading={isSaving}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
