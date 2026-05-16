import { Response } from 'express';

export const response = {
  ok: <T>(res: Response, data: T, meta?: any) => {
    return res.status(200).json({ success: true, data, meta });
  },

  created: <T>(res: Response, data: T) => {
    return res.status(201).json({ success: true, data });
  },

  noContent: (res: Response) => {
    return res.status(204).send();
  },

  paginated: <T>(res: Response, data: T, meta: { page: number; perPage: number; total: number; totalPages: number }) => {
    return res.status(200).json({ success: true, data, meta });
  },

  badRequest: (res: Response, code: string, message: string, fields?: Record<string, string>) => {
    return res.status(400).json({ success: false, error: { code, message, fields } });
  },

  unauthorized: (res: Response, message = 'Authentication required') => {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message } });
  },

  forbidden: (res: Response, message = 'Access denied') => {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message } });
  },

  notFound: (res: Response, resource = 'Resource') => {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `${resource} not found` } });
  },

  conflict: (res: Response, message: string) => {
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message } });
  },

  unprocessable: (res: Response, fields: Record<string, string>, message = 'Validation failed') => {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message, fields } });
  },

  tooManyRequests: (res: Response, retryAfter?: number, message = 'Too many requests') => {
    if (retryAfter) res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message } });
  },

  serverError: (res: Response, message = 'Internal server error') => {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message } });
  },
};
