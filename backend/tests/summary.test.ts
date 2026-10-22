import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Loan } from '../src/models/Loan';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Dashboard Summary API Flow (GET /api/summary)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeEach(async () => {
    const user1 = await User.create({ phoneNumber: '+919333333333' });
    user1Id = user1._id.toString();
    user1Token = jwt.sign({ userId: user1Id, phoneNumber: user1.phoneNumber }, config.jwtSecret);

    const user2 = await User.create({ phoneNumber: '+919444444444' });
    user2Id = user2._id.toString();
    user2Token = jwt.sign({ userId: user2Id, phoneNumber: user2.phoneNumber }, config.jwtSecret);
  });

  it('should return all zeros when a user has no loans', async () => {
    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      outstandingAmount: 0,
      overdueAmount: 0,
      activeLoansCount: 0,
      repaidLoansCount: 0,
    });
  });

  it('should accurately calculate totalLent, totalRepaid, outstanding, overdue, and counts', async () => {
    const pastDueDate = new Date(Date.now() - 3 * 86400000); // 3 days ago
    const futureDueDate = new Date(Date.now() + 5 * 86400000); // 5 days from now

    // Loan 1: Active, partially repaid (₹5000 lent, ₹2000 repaid, ₹3000 outstanding)
    await Loan.create({
      userId: user1Id,
      friendName: 'Rohan',
      amount: 5000,
      dateLent: new Date(),
      dueDate: futureDueDate,
      amountRepaid: 2000,
      outstandingBalance: 3000,
      status: 'partially repaid',
    });

    // Loan 2: Fully repaid (₹4000 lent, ₹4000 repaid, ₹0 outstanding)
    await Loan.create({
      userId: user1Id,
      friendName: 'Ananya',
      amount: 4000,
      dateLent: new Date(),
      dueDate: futureDueDate,
      amountRepaid: 4000,
      outstandingBalance: 0,
      status: 'repaid',
    });

    // Loan 3: Overdue (₹6000 lent, ₹1000 repaid, ₹5000 outstanding)
    await Loan.create({
      userId: user1Id,
      friendName: 'Vikram',
      amount: 6000,
      dateLent: new Date(Date.now() - 10 * 86400000),
      dueDate: pastDueDate,
      amountRepaid: 1000,
      outstandingBalance: 5000,
      status: 'overdue',
    });

    // Seed Loan for User 2 (MUST NOT affect User 1)
    await Loan.create({
      userId: user2Id,
      friendName: 'Other Person',
      amount: 50000,
      dateLent: new Date(),
      dueDate: futureDueDate,
      amountRepaid: 0,
      outstandingBalance: 50000,
      status: 'pending',
    });

    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data;
    // User 1 totals:
    // totalLent = 5000 + 4000 + 6000 = 15000
    expect(summary.totalLent).toBe(15000);
    // totalRepaid = 2000 + 4000 + 1000 = 7000
    expect(summary.totalRepaid).toBe(7000);
    // outstandingAmount = 3000 + 0 + 5000 = 8000
    expect(summary.outstandingAmount).toBe(8000);
    // overdueAmount = 5000 (Loan 3)
    expect(summary.overdueAmount).toBe(5000);
    // activeLoansCount = 2 (Loan 1 and Loan 3)
    expect(summary.activeLoansCount).toBe(2);
    // repaidLoansCount = 1 (Loan 2)
    expect(summary.repaidLoansCount).toBe(1);
  });
});
