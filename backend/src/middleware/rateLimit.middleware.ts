import rateLimit from 'express-rate-limit';

// Rate limit for requesting OTP: max 5 requests per 10 minutes per IP
export const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // Generous enough for development/testing, secure for production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 10 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// Rate limit for OTP verification: max 15 attempts per 10 minutes per IP
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please try again after 10 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// General API rate limiter: 200 requests per 15 minutes
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
