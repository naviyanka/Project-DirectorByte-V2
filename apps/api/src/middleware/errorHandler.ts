import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { response } from '../utils/response';
import { AppError } from '../utils/errors';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  if (!err.isOperational || env.NODE_ENV === 'development') {
    logger.error({ 
      err, 
      reqId: req.id,
      path: req.path,
      method: req.method 
    }, err.message || 'Unhandled error');
  } else {
    logger.warn({ reqId: req.id, code: err.code }, err.message);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    const fields = (err as any).fields;
    const retryAfter = (err as any).retryAfter;

    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(fields && { fields }),
      },
    });
  }

  // Handle generic / unexpected errors
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';
  return response.serverError(res, message);
};
