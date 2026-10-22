import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { loanService } from '../services/loan.service';
import { AppError } from '../middleware/error.middleware';

export class LoanController {
  /**
   * POST /api/loans
   * Create a new loan entry
   */
  async createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loan = await loanService.createLoan(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans
   * List authenticated user's loans
   */
  async getLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loans = await loanService.getLoans(userId, req.query as any);

      res.status(200).json({
        success: true,
        count: loans.length,
        data: loans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/:id
   * Get single loan entry by ID
   */
  async getLoanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = req.params.id as string;
      const loan = await loanService.getLoanById(userId, loanId);

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/loans/:id/repay
   * Record a partial or full repayment
   */
  async recordRepayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = req.params.id as string;
      const updatedLoan = await loanService.recordRepayment(
        userId,
        loanId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Repayment recorded successfully',
        data: updatedLoan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/loans/:id
   * Delete a loan entry
   */
  async deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = req.params.id as string;
      const result = await loanService.deleteLoan(userId, loanId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/loans/:id/receipt
   * Upload receipt image attachment
   */
  async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = req.params.id as string;
      if (!req.file) {
        throw new AppError('No receipt image file provided', 400);
      }

      const loan = await loanService.attachReceipt(userId, loanId, req.file);

      res.status(200).json({
        success: true,
        message: 'Receipt photo uploaded successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/:id/receipt
   * Securely view or download the attached receipt image
   */
  async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = req.params.id as string;
      const loan = await loanService.getLoanById(userId, loanId);

      if (!loan.receiptPath || !fs.existsSync(loan.receiptPath)) {
        throw new AppError('Receipt not found for this loan', 404);
      }

      const filePath = path.resolve(loan.receiptPath);
      res.setHeader('Content-Type', loan.receiptMimeType || 'image/jpeg');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export const loanController = new LoanController();
