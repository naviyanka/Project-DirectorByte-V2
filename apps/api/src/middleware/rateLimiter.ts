import rateLimit from 'express-rate-limit';
import { response } from '../utils/response';
import Redis from 'ioredis';
import { getEnv, safeEnv } from '../config/env';

const handler = (req: any, res: any, next: any, options: any) => {
  return response.tooManyRequests(res, Math.ceil(options.windowMs / 1000));
};

let _authLimiter: any;
export const authLimiter = (req: any, res: any, next: any) => {
  if (!_authLimiter) {
    _authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: safeEnv.NODE_ENV === 'development' ? 1000 : 10,
      standardHeaders: true,
      legacyHeaders: false,
      handler,
      skip: () => process.env.NODE_ENV === 'test' // Fix for express-rate-limit ERR_ERL_CREATED_IN_REQUEST_HANDLER in tests
    });
  }
  return _authLimiter(req, res, next);
};

let _apiLimiter: any;
export const apiLimiter = (req: any, res: any, next: any) => {
  if (!_apiLimiter) {
    _apiLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: safeEnv.NODE_ENV === 'development' ? 10000 : 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler,
      skip: () => process.env.NODE_ENV === 'test'
    });
  }
  return _apiLimiter(req, res, next);
};

let redis: any;
const getRedis = () => {
  if (!redis) redis = new Redis(getEnv().REDIS_URL);
  return redis;
};

export const generationLimiter = async (req: any, res: any, next: any) => {
  try {
    if (process.env.NODE_ENV === 'test') return next();
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
      getRedis().incr(minuteKey),
      getRedis().incr(hourKey)
    ]);

    if (minuteCount === 1) await getRedis().expire(minuteKey, 60);
    if (hourCount === 1) await getRedis().expire(hourKey, 3600);

    if (minuteCount > requestsPerMinute) {
      return response.tooManyRequests(res, 60, `Generation limit reached: ${requestsPerMinute} per minute on your plan. Upgrade for higher limits.`);
    }

    if (hourCount > requestsPerHour) {
      return response.tooManyRequests(res, 3600, `Hourly generation limit reached (${requestsPerHour}/hr on your plan). Try again later or upgrade.`);
    }

    next();
  } catch (error) {
    next();
  }
};

let _uploadLimiter: any;
export const uploadLimiter = (req: any, res: any, next: any) => {
  if (!_uploadLimiter) {
    _uploadLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      handler,
      skip: () => process.env.NODE_ENV === 'test'
    });
  }
  return _uploadLimiter(req, res, next);
};
