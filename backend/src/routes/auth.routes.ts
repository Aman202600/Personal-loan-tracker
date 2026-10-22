import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { requestOtpSchema, verifyOtpSchema } from '../validators/auth.validator';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Request OTP with rate limit
router.post(
  '/otp/request',
  otpRequestLimiter,
  validateBody(requestOtpSchema),
  authController.requestOtp
);

// Verify OTP with rate limit
router.post(
  '/otp/verify',
  otpVerifyLimiter,
  validateBody(verifyOtpSchema),
  authController.verifyOtp
);

// Get current user profile (authenticated)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
