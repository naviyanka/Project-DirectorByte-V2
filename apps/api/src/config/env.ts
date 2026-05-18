import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load api-level .env first (has real secrets), then root as fallback.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('DirectorByte'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),

  ADMIN_SESSION_SECRET: z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  PLATFORM_RUNWAYML_API_KEY:    z.string().optional(),
  PLATFORM_KLING_ACCESS_KEY:    z.string().optional(),
  PLATFORM_KLING_SECRET_KEY:    z.string().optional(),
  PLATFORM_PIKA_API_KEY:        z.string().optional(),
  PLATFORM_SUNO_API_KEY:        z.string().optional(),
  PLATFORM_MUBERT_API_KEY:      z.string().optional(),
  PLATFORM_ELEVENLABS_API_KEY:  z.string().optional(),
  PLATFORM_PLAYHT_API_KEY:      z.string().optional(),
  PLATFORM_PLAYHT_USER_ID:      z.string().optional(),
  PLATFORM_STABILITY_API_KEY:   z.string().optional(),
  PLATFORM_FAL_API_KEY:         z.string().optional(),
  PLATFORM_WHISPER_API_KEY:     z.string().optional(),

  PAYMENT_GATEWAY: z.enum(['stripe', 'paddle', 'razorpay', 'manual']).default('stripe'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default('DirectorByte'),

  STORAGE_PROVIDER: z.enum(['local', 'gcs', 'drive']).default('local'),
  LOCAL_UPLOAD_PATH: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(100),
});

type EnvVariables = z.infer<typeof envSchema>;

let cachedEnv: EnvVariables | null = null;

export const getEnv = (): EnvVariables => {
  if (cachedEnv) return cachedEnv;

  const _env = envSchema.safeParse(process.env);
  if (!_env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(_env.error.format());
    process.exit(1);
  }

  cachedEnv = _env.data;
  return cachedEnv;
};

// Safe defaults for when env validation fails because we are in pre-install mode
export const safeEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:4000'
};
