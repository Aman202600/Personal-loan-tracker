import { app } from './app';
import { connectDB, disconnectDB } from './config/db';
import { config } from './config/env';
import { logger } from './utils/logger';

let server: any = null;

async function startServer(): Promise<void> {
  try {
    // Attempt database connection
    try {
      await connectDB();
    } catch (dbError: any) {
      logger.warn(
        `Unable to connect to MongoDB at ${config.mongoUri}. If running without a local MongoDB instance, please configure MONGODB_URI in backend/.env with your MongoDB Atlas connection string. Proceeding to listen for HTTP requests...`
      );
    }

    server = app.listen(config.port, () => {
      logger.info('======================================================');
      logger.info(`  MiniLedger Backend Server is running!`);
      logger.info(`  Port:        ${config.port}`);
      logger.info(`  Environment: ${config.nodeEnv}`);
      logger.info(`  Healthcheck: http://localhost:${config.port}/api/health`);
      logger.info(`  Mock OTP Dev: ${config.allowDevMockOtp ? 'ENABLED (Code: ' + config.devMockOtpCode + ')' : 'DISABLED'}`);
      logger.info('======================================================');
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Fatal server startup failure:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
