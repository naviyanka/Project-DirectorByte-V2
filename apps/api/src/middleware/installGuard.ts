import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const isInstalled = () => {
  const lockFilePath = path.resolve(__dirname, '../../../../../.install.lock');
  return fs.existsSync(lockFilePath);
};

export const installGuard = (req: Request, res: Response, next: NextFunction) => {
  // If the route is related to installation, let it through
  if (req.path.startsWith('/api/v1/install')) {
    return next();
  }

  // Allow static assets to be served
  if (!req.path.startsWith('/api/v1')) {
    return next();
  }

  if (process.env.NODE_ENV === "test") return next();
  if (!isInstalled()) {
    return res.status(403).json({
      success: false,
      error: { code: 'NOT_INSTALLED', message: 'Application is not installed.' }
    });
  }

  next();
};
