import request from 'supertest';
import { app } from '../src/app';
import { Otp } from '../src/models/Otp';
import { User } from '../src/models/User';

describe('Authentication & OTP API Flow', () => {
  const testPhone = '+919876543210';

  describe('POST /api/auth/otp/request', () => {
    it('should generate an OTP and return 200 without exposing OTP in response', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ phoneNumber: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();

      // Ensure OTP code is NOT leaked in response
      expect(res.body.otp).toBeUndefined();
      expect(res.body.code).toBeUndefined();
      expect(res.body.data).toBeUndefined();

      // Verify OTP is stored in DB
      const otpRecord = await Otp.findOne({ phoneNumber: testPhone, isUsed: false });
      expect(otpRecord).toBeDefined();
      expect(otpRecord!.otp).toHaveLength(6);
    });

    it('should reject invalid phone number format', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ phoneNumber: 'invalid-phone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    it('should verify correct OTP, issue JWT, create user, and invalidate OTP', async () => {
      // Step 1: Request OTP
      await request(app)
        .post('/api/auth/otp/request')
        .send({ phoneNumber: testPhone });

      const otpDoc = await Otp.findOne({ phoneNumber: testPhone, isUsed: false });
      expect(otpDoc).toBeTruthy();

      // Step 2: Verify with correct OTP
      const verifyRes = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phoneNumber: testPhone, otp: otpDoc!.otp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.token).toBeDefined();
      expect(verifyRes.body.data.user.phoneNumber).toBe(testPhone);

      // Verify OTP is now marked as used
      const updatedOtp = await Otp.findById(otpDoc!._id);
      expect(updatedOtp!.isUsed).toBe(true);

      // Verify user was persisted
      const user = await User.findOne({ phoneNumber: testPhone });
      expect(user).toBeTruthy();

      // Step 3: Reusing the same OTP must fail
      const reuseRes = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phoneNumber: testPhone, otp: otpDoc!.otp });

      expect(reuseRes.status).toBe(400);
    });

    it('should reject incorrect OTP and track attempts', async () => {
      await request(app)
        .post('/api/auth/otp/request')
        .send({ phoneNumber: testPhone });

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phoneNumber: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid verification code');

      const otpDoc = await Otp.findOne({ phoneNumber: testPhone });
      expect(otpDoc!.attempts).toBe(1);
    });

    it('should reject expired OTP', async () => {
      // Create expired OTP directly
      await Otp.create({
        phoneNumber: testPhone,
        otp: '654321',
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute in the past
      });

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phoneNumber: testPhone, otp: '654321' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('should lockout after reaching maximum verification attempts', async () => {
      const { config } = require('../src/config/env');
      await Otp.create({
        phoneNumber: testPhone,
        otp: '999999',
        attempts: config.maxOtpAttempts, // Max attempts reached
        isUsed: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      });

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phoneNumber: testPhone, otp: '999999' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Maximum verification attempts exceeded');
    });
  });

  describe('Unauthorized API Access Protection', () => {
    it('should return 401 when accessing /api/loans without token', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when accessing /api/loans with corrupted token', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when accessing /api/summary without token', async () => {
      const res = await request(app).get('/api/summary');
      expect(res.status).toBe(401);
    });
  });
});
