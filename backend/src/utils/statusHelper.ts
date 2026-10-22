export type LoanStatus = 'pending' | 'partially repaid' | 'repaid' | 'overdue';

export interface LoanCalculations {
  amountRepaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  isOverdue: boolean;
}

/**
 * Calculates the current loan status, balance, and overdue state based on
 * original amount, repayments sum, and due date.
 *
 * Timezone assumption:
 * Dates are stored in UTC ISO format. A loan is deemed overdue when the current
 * UTC timestamp exceeds the due date timestamp and outstanding balance > 0.
 */
export function calculateLoanState(
  originalAmount: number,
  repayments: Array<{ amount: number }> | number,
  dueDate: Date | string,
  referenceDate: Date = new Date()
): LoanCalculations {
  const totalRepaid = typeof repayments === 'number'
    ? repayments
    : repayments.reduce((sum, r) => sum + r.amount, 0);

  // Round to 2 decimal places to avoid IEEE floating point inaccuracies
  const roundedRepaid = Math.round(totalRepaid * 100) / 100;
  const rawBalance = originalAmount - roundedRepaid;
  const outstandingBalance = Math.max(0, Math.round(rawBalance * 100) / 100);

  const due = new Date(dueDate);
  const now = new Date(referenceDate);

  let status: LoanStatus;
  let isOverdue = false;

  if (outstandingBalance <= 0) {
    status = 'repaid';
  } else if (now.getTime() > due.getTime()) {
    status = 'overdue';
    isOverdue = true;
  } else if (roundedRepaid > 0) {
    status = 'partially repaid';
  } else {
    status = 'pending';
  }

  return {
    amountRepaid: roundedRepaid,
    outstandingBalance,
    status,
    isOverdue,
  };
}
