import { PrismaClient } from '@prisma/client';

export async function seedPlans(prisma: PrismaClient) {
  const plans = [
    {
      name: 'Free Plan',
      slug: 'free',
      description: 'Start your creative journey for free.',
      priceMonthly: 0,
      priceAnnual: 0,
      currency: 'USD',
      isActive: true,
      isPublic: true,
      sortOrder: 1,
      trialDays: 0,
      limits: {
        creditsPerMonth: 50,
        storageGb: 2,
        maxProjects: 5,
        maxExportsPerMonth: 10,
        maxCollaborators: 0,
        maxFileSizeMb: 100,
      },
      features: {
        useManagedKeys: false,
        googleDriveStorage: false,
        projectSharing: false,
        versionHistory: false,
        prioritySupport: false,
        apiAccess: false,
        advancedExport: false,
        watermarkFree: false,
        modules: ['chat', 'script', 'storyboard', 'image_gen'],
      },
    },
    {
      name: 'Creator Plan',
      slug: 'creator',
      description: 'Perfect for content creators and small projects.',
      priceMonthly: 19,
      priceAnnual: 190,
      currency: 'USD',
      isActive: true,
      isPublic: true,
      sortOrder: 2,
      trialDays: 7,
      limits: {
        creditsPerMonth: 500,
        storageGb: 20,
        maxProjects: -1, // Unlimited
        maxExportsPerMonth: 100,
        maxCollaborators: 3,
        maxFileSizeMb: 500,
      },
      features: {
        useManagedKeys: true,
        googleDriveStorage: true,
        projectSharing: true,
        versionHistory: true,
        prioritySupport: false,
        apiAccess: false,
        advancedExport: true,
        watermarkFree: true,
        modules: ['chat', 'script', 'storyboard', 'image_gen', 'video_gen', 'audio_gen', 'voiceover'],
      },
    },
    {
      name: 'Studio Plan',
      slug: 'studio',
      description: 'The ultimate production power for professionals.',
      priceMonthly: 49,
      priceAnnual: 490,
      currency: 'USD',
      isActive: true,
      isPublic: true,
      sortOrder: 3,
      trialDays: 7,
      limits: {
        creditsPerMonth: 2000,
        storageGb: 100,
        maxProjects: -1, // Unlimited
        maxExportsPerMonth: -1, // Unlimited
        maxCollaborators: 10,
        maxFileSizeMb: 2000,
      },
      features: {
        useManagedKeys: true,
        googleDriveStorage: true,
        projectSharing: true,
        versionHistory: true,
        prioritySupport: true,
        apiAccess: true,
        advancedExport: true,
        watermarkFree: true,
        modules: ['chat', 'script', 'storyboard', 'image_gen', 'video_gen', 'audio_gen', 'voiceover', 'upscale', 'background_removal'],
      },
    },
  ];

  console.warn('Seeding plans...');
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.warn('Plans seeded successfully.');
}
