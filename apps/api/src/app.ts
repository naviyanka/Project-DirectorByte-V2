import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { installGuard } from './middleware/installGuard';
import routes from './routes';
import { safeEnv, getEnv } from './config/env';

export const createApp = () => {
  const app = express();
  
  // Trust proxy for rate limiting behind Vite/Nginx
  app.set('trust proxy', 1);

  // Security & Utility Middleware
  app.use(helmet());
  app.use(cors({
    origin: safeEnv.APP_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json());
  app.use(cookieParser());
  
  // Custom Global Middleware
  app.use(requestIdMiddleware);

  // Install Guard
  app.use(installGuard);

  // Mount API Routes
  app.use('/api/v1', routes);
  
  // Serve static files from the React app in production
  if (safeEnv.NODE_ENV === 'production') {
    const webDistPath = path.join(__dirname, '../../web/dist');
    app.use(express.static(webDistPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
