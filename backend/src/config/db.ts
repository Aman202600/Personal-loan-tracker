import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

let embeddedServer: any = null;

export const connectDB = async (customUri?: string): Promise<typeof mongoose> => {
  const uri = customUri || config.mongoUri;

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });

    logger.info(`MongoDB Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    // In development mode, if local MongoDB is not running, seamlessly start an embedded instance
    if (config.nodeEnv === 'development' && uri.includes('localhost')) {
      logger.warn(
        `Local MongoDB not detected on port 27017. Launching embedded development MongoDB instance...`
      );
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        embeddedServer = await MongoMemoryServer.create({
          binary: { version: '6.0.14' },
        });
        const memoryUri = embeddedServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        logger.info(`Embedded Development MongoDB running smoothly at: ${memoryUri}`);
        return conn;
      } catch (embeddedErr: any) {
        logger.error(`Failed to launch embedded MongoDB: ${embeddedErr.message}`);
        throw error;
      }
    }

    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (embeddedServer) {
      await embeddedServer.stop();
    }
    logger.info('MongoDB connection closed gracefully');
  } catch (error: any) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};
