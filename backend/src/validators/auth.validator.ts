import { z } from 'zod';

export const requestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(16, 'Phone number must not exceed 16 characters')
    .regex(
      /^\+?[0-9]{7,15}$/,
      'Please enter a valid phone number (e.g., +919876543210 or 9876543210)'
    ),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(16, 'Phone number must not exceed 16 characters')
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
