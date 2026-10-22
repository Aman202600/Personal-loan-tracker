import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled request error:', err.message || err);

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid identifier format: ${err.value}`,
    });
    return;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'File size exceeds maximum allowed limit (5MB)',
    });
    return;
  }

  // Default server error
  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && config.nodeEnv === 'production'
    ? 'Internal server error. Please try again later.'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
};
