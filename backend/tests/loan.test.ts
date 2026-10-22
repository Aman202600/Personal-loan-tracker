import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Loan } from '../src/models/Loan';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Loan Management API Flow', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeEach(async () => {
    // Seed user 1
    const user1 = await User.create({ phoneNumber: '+919111111111' });
    user1Id = user1._id.toString();
    user1Token = jwt.sign({ userId: user1Id, phoneNumber: user1.phoneNumber }, config.jwtSecret);

    // Seed user 2
    const user2 = await User.create({ phoneNumber: '+919222222222' });
    user2Id = user2._id.toString();
    user2Token = jwt.sign({ userId: user2Id, phoneNumber: user2.phoneNumber }, config.jwtSecret);
  });

  describe('POST /api/loans (Create Loan)', () => {
    it('should create a valid loan entry', async () => {
      const today = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: 5000,
          dateLent: today.toISOString(),
          dueDate: nextWeek.toISOString(),
          notes: 'Dinner and movie expenses',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendName).toBe('Rahul Sharma');
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.amountRepaid).toBe(0);
      expect(res.body.data.outstandingBalance).toBe(5000);
      expect(res.body.data.status).toBe('pending');
    });

    it('should reject invalid amount (negative or zero)', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: -500,
          dateLent: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject when due date is earlier than date lent', async () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: 1000,
          dateLent: today.toISOString(),
          dueDate: yesterday.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('Due date must be on or after');
    });
  });

  describe('PATCH /api/loans/:id/repay (Repayments)', () => {
    it('should record a partial repayment and update outstanding balance', async () => {
      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'Priya Singh',
        amount: 10000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 7 * 86400000),
        amountRepaid: 0,
        outstandingBalance: 10000,
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/loans/${loan._id}/repay`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 4000,
          notes: 'First installment via UPI',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amountRepaid).toBe(4000);
      expect(res.body.data.outstandingBalance).toBe(6000);
      expect(res.body.data.status).toBe('partially repaid');
      expect(res.body.data.repayments).toHaveLength(1);
      expect(res.body.data.repayments[0].amount).toBe(4000);
    });

    it('should record full repayment and mark status as repaid', async () => {
      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'Amit Verma',
        amount: 2500,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 7 * 86400000),
        amountRepaid: 0,
        outstandingBalance: 2500,
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/loans/${loan._id}/repay`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 2500,
          notes: 'Paid in full',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.amountRepaid).toBe(2500);
      expect(res.body.data.outstandingBalance).toBe(0);
      expect(res.body.data.status).toBe('repaid');
    });

    it('should reject repayment exceeding outstanding balance', async () => {
      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'Karan Mehra',
        amount: 1000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 7 * 86400000),
        amountRepaid: 500,
        outstandingBalance: 500,
        status: 'partially repaid',
      });

      const res = await request(app)
        .patch(`/api/loans/${loan._id}/repay`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 600, // Exceeds balance of 500
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot exceed the outstanding balance');
    });

    it('should reject repayment on already fully repaid loan', async () => {
      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'Karan Mehra',
        amount: 1000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 7 * 86400000),
        amountRepaid: 1000,
        outstandingBalance: 0,
        status: 'repaid',
      });

      const res = await request(app)
        .patch(`/api/loans/${loan._id}/repay`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been fully repaid');
    });
  });

  describe('Overdue Status Calculation', () => {
    it('should correctly identify and return overdue loans', async () => {
      // Due date 2 days in the past
      const pastDueDate = new Date(Date.now() - 2 * 86400000);

      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'Sneha Kapur',
        amount: 8000,
        dateLent: new Date(Date.now() - 10 * 86400000),
        dueDate: pastDueDate,
        amountRepaid: 2000,
        outstandingBalance: 6000,
        status: 'partially repaid', // will be evaluated as overdue
      });

      const res = await request(app)
        .get(`/api/loans/${loan._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('overdue');
      expect(res.body.data.outstandingBalance).toBe(6000);
    });
  });

  describe('Cross-User Data Isolation Protection', () => {
    it('should prevent User 2 from accessing User 1 loans by ID', async () => {
      const user1Loan = await Loan.create({
        userId: user1Id,
        friendName: 'Confidential Friend',
        amount: 50000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        amountRepaid: 0,
        outstandingBalance: 50000,
        status: 'pending',
      });

      // User 2 tries to GET User 1's loan
      const getRes = await request(app)
        .get(`/api/loans/${user1Loan._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(getRes.status).toBe(404);

      // User 2 tries to REPAY User 1's loan
      const repayRes = await request(app)
        .patch(`/api/loans/${user1Loan._id}/repay`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ amount: 1000 });

      expect(repayRes.status).toBe(404);

      // User 2 tries to DELETE User 1's loan
      const deleteRes = await request(app)
        .delete(`/api/loans/${user1Loan._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(404);
    });

    it('should only return User 1 loans when User 1 queries /api/loans', async () => {
      await Loan.create({
        userId: user1Id,
        friendName: 'User1 Friend',
        amount: 1000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        amountRepaid: 0,
        outstandingBalance: 1000,
        status: 'pending',
      });

      await Loan.create({
        userId: user2Id,
        friendName: 'User2 Friend',
        amount: 2000,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        amountRepaid: 0,
        outstandingBalance: 2000,
        status: 'pending',
      });

      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].friendName).toBe('User1 Friend');
    });
  });

  describe('DELETE /api/loans/:id', () => {
    it('should delete a loan owned by the user', async () => {
      const loan = await Loan.create({
        userId: user1Id,
        friendName: 'To be deleted',
        amount: 500,
        dateLent: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        amountRepaid: 0,
        outstandingBalance: 500,
        status: 'pending',
      });

      const res = await request(app)
        .delete(`/api/loans/${loan._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Loan.findById(loan._id);
      expect(check).toBeNull();
    });
  });
});
