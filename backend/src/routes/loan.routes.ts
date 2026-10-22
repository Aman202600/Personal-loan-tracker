import { Router } from 'express';
import { loanController } from '../controllers/loan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createLoanSchema,
  recordRepaymentSchema,
  queryLoansSchema,
} from '../validators/loan.validator';
import { uploadReceipt } from '../middleware/upload.middleware';

const router = Router();

// Protect all loan routes with authentication
router.use(authenticate);

// Create loan
router.post('/', validateBody(createLoanSchema), loanController.createLoan);

// List loans with filters
router.get('/', validateQuery(queryLoansSchema), loanController.getLoans);

// Get specific loan
router.get('/:id', loanController.getLoanById);

// Record repayment
router.patch(
  '/:id/repay',
  validateBody(recordRepaymentSchema),
  loanController.recordRepayment
);

// Delete loan
router.delete('/:id', loanController.deleteLoan);

// Receipt upload & download
router.post(
  '/:id/receipt',
  uploadReceipt.single('receipt'),
  loanController.uploadReceipt
);
router.get('/:id/receipt', loanController.getReceipt);

export default router;
