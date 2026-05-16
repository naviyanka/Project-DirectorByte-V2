import rateLimit from 'express-rate-limit';
import { response } from '../utils/response';

const handler = (req: any, res: any, next: any, options: any) => {
  return response.tooManyRequests(res, Math.ceil(options.windowMs / 1000));
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 1000 : 10, // Higher limit in dev
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'development' ? 10000 : 100, // Higher limit in dev
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL);

export const generationLimiter = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    if (!user) return next();

    let requestsPerMinute = 2;
    let requestsPerHour = 10;

    switch (user.planSlug) {
      case 'free':
        requestsPerMinute = 2;
        requestsPerHour = 10;
        break;
      case 'creator':
        requestsPerMinute = 5;
        requestsPerHour = 60;
        break;
      case 'studio':
        requestsPerMinute = 10;
        requestsPerHour = 200;
        break;
    }

    const minuteKey = `gen_limit:min:${user.id}`;
    const hourKey = `gen_limit:hr:${user.id}`;

    const [minuteCount, hourCount] = await Promise.all([
      redis.incr(minuteKey),
      redis.incr(hourKey)
    ]);

    if (minuteCount === 1) await redis.expire(minuteKey, 60);
    if (hourCount === 1) await redis.expire(hourKey, 3600);

    if (minuteCount > requestsPerMinute) {
      return response.tooManyRequests(res, 60, `Generation limit reached: ${requestsPerMinute} per minute on your plan. Upgrade for higher limits.`);
    }

    if (hourCount > requestsPerHour) {
      return response.tooManyRequests(res, 3600, `Hourly generation limit reached (${requestsPerHour}/hr on your plan). Try again later or upgrade.`);
    }

    next();
  } catch (error) {
    // If redis fails, fallback to letting them through (fail open)
    next();
  }
};

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
