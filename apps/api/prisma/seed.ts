import { PrismaClient } from '@prisma/client';
import { seedPlans } from './seeds/plans.seed';
import { seedSystemSettings } from './seeds/systemsettings.seed';

const prisma = new PrismaClient();

async function main() {
  console.warn('Starting database seed...');
  
  try {
    await seedPlans(prisma);
    await seedSystemSettings(prisma);
    
    console.warn('Database seed completed successfully.');
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
