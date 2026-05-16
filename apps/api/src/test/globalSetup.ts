import { execSync } from 'child_process';
import dotenv from 'dotenv';

export async function setup() {
  console.warn('Global setup starting...');
  
  // Load test environment variables
  dotenv.config({ path: '.env.test' });
  
  // Ensure we are using a test database
  if (!process.env.DATABASE_URL?.includes('_test')) {
    // throw new Error('DATABASE_URL must point to a test database (e.g., ending with _test)');
    console.warn('WARNING: DATABASE_URL does not seem to be a test database. Proceeding anyway...');
  }

  try {
    // Run migrations on test DB
    // console.warn('Running migrations on test database...');
    // execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
  
  console.warn('Global setup complete.');
}

export async function teardown() {
  console.warn('Global teardown...');
}
