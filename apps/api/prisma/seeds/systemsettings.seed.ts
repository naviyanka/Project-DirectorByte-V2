import { PrismaClient } from '@prisma/client';

export async function seedSystemSettings(prisma: PrismaClient) {
  const settings = [
    { key: 'app.maintenanceMode', value: JSON.stringify(false), description: 'Global maintenance mode flag' },
    { key: 'app.registrationOpen', value: JSON.stringify(true), description: 'Whether new users can register' },
    { key: 'auth.maxLoginAttempts', value: JSON.stringify(5), description: 'Max login failures before lockout' },
    { key: 'auth.lockoutDurationMinutes', value: JSON.stringify(30), description: 'Duration of account lockout' },
    { key: 'auth.sessionLifetimeHours', value: JSON.stringify(24), description: 'How long a session remains valid' },
    { key: 'subscription.gracePeriodDays', value: JSON.stringify(3), description: 'Days after expiry before service cut-off' },
    { key: 'subscription.renewalReminderDays', value: JSON.stringify([7, 1]), description: 'Days before renewal to send reminders' },
    { key: 'support.autoCloseDays', value: JSON.stringify(7), description: 'Days of inactivity before ticket auto-closure' },
    { key: 'support.defaultPriority', value: JSON.stringify('NORMAL'), description: 'Default priority for new tickets' },
    { key: 'email.supportAddress', value: JSON.stringify('support@directorbyte.com'), description: 'Public support email address' },
    { key: 'storage.defaultProvider', value: JSON.stringify('local'), description: 'Default storage provider for new users' },
  ];

  console.warn('Seeding system settings...');
  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.warn('System settings seeded successfully.');
}
