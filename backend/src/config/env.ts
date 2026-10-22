import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/miniledger',
  jwtSecret: process.env.JWT_SECRET || 'default_dev_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10),
  allowDevMockOtp: process.env.NODE_ENV !== 'test' && process.env.ALLOW_DEV_MOCK_OTP === 'true',
  devMockOtpCode: process.env.DEV_MOCK_OTP_CODE || '123456',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '5242880', 10), // 5MB
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
