import mongoose from 'mongoose';
import { Loan } from '../models/Loan';

export interface DashboardSummary {
  totalLent: number;
  totalRepaid: number;
  outstandingAmount: number;
  overdueAmount: number;
  activeLoansCount: number;
  repaidLoansCount: number;
}

export class SummaryService {
  /**
   * Calculates dashboard summary metrics using MongoDB aggregation,
   * scoped strictly to the authenticated user.
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    const result = await Loan.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalLent: { $sum: '$amount' },
          totalRepaid: { $sum: '$amountRepaid' },
          outstandingAmount: { $sum: '$outstandingBalance' },
          overdueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', now] },
                    { $gt: ['$outstandingBalance', 0] },
                  ],
                },
                '$outstandingBalance',
                0,
              ],
            },
          },
          activeLoansCount: {
            $sum: {
              $cond: [{ $gt: ['$outstandingBalance', 0] }, 1, 0],
            },
          },
          repaidLoansCount: {
            $sum: {
              $cond: [{ $lte: ['$outstandingBalance', 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return {
        totalLent: 0,
        totalRepaid: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        activeLoansCount: 0,
        repaidLoansCount: 0,
      };
    }

    const data = result[0];
    return {
      totalLent: Math.round(data.totalLent * 100) / 100,
      totalRepaid: Math.round(data.totalRepaid * 100) / 100,
      outstandingAmount: Math.round(data.outstandingAmount * 100) / 100,
      overdueAmount: Math.round(data.overdueAmount * 100) / 100,
      activeLoansCount: data.activeLoansCount || 0,
      repaidLoansCount: data.repaidLoansCount || 0,
    };
  }
}

export const summaryService = new SummaryService();
