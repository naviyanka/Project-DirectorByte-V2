import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Strip unknown fields by using safeParse on body
      const parsedResult = schema.safeParse(req.body);
      
      if (!parsedResult.success) {
        const errorDetails: Record<string, string> = {};
        parsedResult.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          errorDetails[path] = issue.message;
        });
        
        throw new ValidationError('Validation failed', errorDetails);
      }

      req.body = parsedResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
