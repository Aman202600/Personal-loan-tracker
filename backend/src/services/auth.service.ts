import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser } from '../models/User';
import { Otp } from '../models/Otp';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  /**
   * Generates a secure random 6-digit numeric OTP code.
   */
  private generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Request an OTP for a given phone number.
   * Prints OTP to the server console and NEVER returns it in the API response.
   */
  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    // Invalidate previous unused OTPs for this phone number
    await Otp.updateMany(
      { phoneNumber, isUsed: false },
      { $set: { isUsed: true } }
    );

    // Store new OTP
    await Otp.create({
      phoneNumber,
      otp: code,
      attempts: 0,
      isUsed: false,
      expiresAt,
    });

    // Securely log mock OTP to the server console
    logger.otp(phoneNumber, code, config.otpExpiryMinutes);

    return {
      success: true,
      message: 'Verification code sent. Please check your console in development mode.',
    };
  }

  /**
   * Verifies the OTP, invalidates it upon success, and returns a signed JWT.
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string
  ): Promise<{ token: string; user: { id: string; phoneNumber: string; createdAt: Date } }> {
    // Check if development mock OTP is enabled and matches
    const isDevMockMatch =
      config.allowDevMockOtp &&
      config.devMockOtpCode &&
      otp === config.devMockOtpCode;

    let otpRecord = null;

    if (!isDevMockMatch) {
      // Find latest unexpired, unused OTP for this phone number
      otpRecord = await Otp.findOne({
        phoneNumber,
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        throw new AppError('No active OTP found. Please request a new code.', 400);
      }

      // Check if expired
      if (new Date() > otpRecord.expiresAt) {
        throw new AppError('OTP has expired. Please request a new verification code.', 400);
      }

      // Check attempt limits
      if (otpRecord.attempts >= config.maxOtpAttempts) {
        otpRecord.isUsed = true;
        await otpRecord.save();
        throw new AppError(
          'Maximum verification attempts exceeded. Please request a new OTP.',
          429
        );
      }

      // Check OTP match
      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = config.maxOtpAttempts - otpRecord.attempts;
        throw new AppError(
          `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          400
        );
      }

      // Invalidate OTP after successful verification
      otpRecord.isUsed = true;
      await otpRecord.save();
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await User.create({ phoneNumber });
      logger.info(`New user registered with phone: ${phoneNumber}`);
    }

    // Generate JWT access token (never log token secret or token value)
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    };
  }
}

export const authService = new AuthService();
