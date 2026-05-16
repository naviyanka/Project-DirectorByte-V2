import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { env } from './config/env';

export const createApp = () => {
  const app = express();
  
  // Trust proxy for rate limiting behind Vite/Nginx
  app.set('trust proxy', 1);

  // Security & Utility Middleware
  app.use(helmet());
  app.use(cors({
    origin: env.APP_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json());
  app.use(cookieParser());
  
  // Custom Global Middleware
  app.use(requestIdMiddleware);

  // Mount API Routes
  app.use('/api/v1', routes);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
