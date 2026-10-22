import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { generalApiLimiter } from './middleware/rateLimit.middleware';
import { config } from './config/env';

export const createApp = (): Application => {
  const app: Application = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing with sensible size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging (disabled in test)
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // General API Rate Limiting
  app.use('/api', generalApiLimiter);

  // Mount Application Routes
  app.use('/api', routes);

  // Root welcome / health check
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'MiniLedger API',
      version: '1.0.0',
      description: 'Personal Loan Tracker Backend Service',
      documentation: '/api/health',
    });
  });

  // Handle 404 for undefined routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export const app = createApp();
