import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';

export interface AuthUser {
  id: string;
  phoneNumber: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Bearer token is empty',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; phoneNumber: string };

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token payload',
      });
      return;
    }

    // Verify user exists in the database
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or corrupted authentication token',
    });
  }
};
