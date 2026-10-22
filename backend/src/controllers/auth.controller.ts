import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  /**
   * POST /api/auth/otp/request
   * Send mock OTP to user's phone (prints to server console)
   */
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber } = req.body;
      const result = await authService.requestOtp(phoneNumber);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/otp/verify
   * Verify entered OTP and issue JWT access token
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, otp } = req.body;
      const result = await authService.verifyOtp(phoneNumber, otp);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user details
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
