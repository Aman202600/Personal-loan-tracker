import mongoose from 'mongoose';
import { Loan, ILoan } from '../models/Loan';
import { calculateLoanState } from '../utils/statusHelper';
import { CreateLoanInput, RecordRepaymentInput, QueryLoansInput } from '../validators/loan.validator';
import { AppError } from '../middleware/error.middleware';

export class LoanService {
  /**
   * Helper to ensure overdue status is fresh when fetching loans
   */
  private syncLoanStatus(loan: ILoan): ILoan {
    const calc = calculateLoanState(
      loan.amount,
      loan.amountRepaid,
      loan.dueDate
    );
    if (loan.status !== calc.status || loan.outstandingBalance !== calc.outstandingBalance) {
      loan.status = calc.status;
      loan.outstandingBalance = calc.outstandingBalance;
      // Fire-and-forget save to keep DB in sync
      loan.save().catch(() => {});
    }
    return loan;
  }

  /**
   * Create a new loan scoped strictly to the authenticated user.
   */
  async createLoan(userId: string, input: CreateLoanInput): Promise<ILoan> {
    const lentDate = new Date(input.dateLent);
    const dueDate = new Date(input.dueDate);

    const calc = calculateLoanState(input.amount, 0, dueDate);

    const loan = await Loan.create({
      userId: new mongoose.Types.ObjectId(userId),
      friendName: input.friendName,
      amount: input.amount,
      dateLent: lentDate,
      dueDate,
      amountRepaid: 0,
      outstandingBalance: calc.outstandingBalance,
      status: calc.status,
      notes: input.notes || '',
      repayments: [],
    });

    return loan;
  }

  /**
   * List all loans for the authenticated user with optional filtering and sorting.
   */
  async getLoans(userId: string, query: QueryLoansInput): Promise<ILoan[]> {
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.search) {
      filter.friendName = { $regex: query.search, $options: 'i' };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField] = sortDirection;

    const loans = await Loan.find(filter).sort(sortOptions);
    return loans.map((loan) => this.syncLoanStatus(loan));
  }

  /**
   * Get a single loan by ID, strictly scoped to the authenticated user.
   */
  async getLoanById(userId: string, loanId: string): Promise<ILoan> {
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      throw new AppError('Invalid loan ID format', 400);
    }

    const loan = await Loan.findOne({
      _id: new mongoose.Types.ObjectId(loanId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    return this.syncLoanStatus(loan);
  }

  /**
   * Record a partial or full repayment on a loan.
   * Validates that repayment does not exceed outstanding balance.
   */
  async recordRepayment(
    userId: string,
    loanId: string,
    input: RecordRepaymentInput
  ): Promise<ILoan> {
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      throw new AppError('Invalid loan ID format', 400);
    }

    const loan = await Loan.findOne({
      _id: new mongoose.Types.ObjectId(loanId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    if (loan.outstandingBalance <= 0 || loan.status === 'repaid') {
      throw new AppError('This loan has already been fully repaid', 400);
    }

    // Check if repayment amount exceeds remaining balance
    const roundedAmount = Math.round(input.amount * 100) / 100;
    if (roundedAmount > loan.outstandingBalance) {
      throw new AppError(
        `Repayment amount (₹${roundedAmount.toFixed(2)}) cannot exceed the outstanding balance (₹${loan.outstandingBalance.toFixed(2)})`,
        400
      );
    }

    // Append repayment subdocument
    loan.repayments.push({
      amount: roundedAmount,
      date: input.date ? new Date(input.date) : new Date(),
      notes: input.notes || '',
    });

    // Recalculate loan state
    const calc = calculateLoanState(loan.amount, loan.repayments, loan.dueDate);
    loan.amountRepaid = calc.amountRepaid;
    loan.outstandingBalance = calc.outstandingBalance;
    loan.status = calc.status;

    await loan.save();
    return loan;
  }

  /**
   * Delete a loan by ID, scoped to user.
   */
  async deleteLoan(userId: string, loanId: string): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      throw new AppError('Invalid loan ID format', 400);
    }

    const result = await Loan.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(loanId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      throw new AppError('Loan not found', 404);
    }

    return {
      success: true,
      message: 'Loan entry successfully deleted',
    };
  }

  /**
   * Attach a receipt photo to a loan.
   */
  async attachReceipt(
    userId: string,
    loanId: string,
    file: Express.Multer.File
  ): Promise<ILoan> {
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      throw new AppError('Invalid loan ID format', 400);
    }

    const loan = await Loan.findOne({
      _id: new mongoose.Types.ObjectId(loanId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    loan.receiptPath = file.path;
    loan.receiptOriginalName = file.originalname;
    loan.receiptMimeType = file.mimetype;

    await loan.save();
    return loan;
  }
}

export const loanService = new LoanService();
