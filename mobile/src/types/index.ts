export type LoanStatus = 'pending' | 'partially repaid' | 'repaid' | 'overdue';

export interface IRepayment {
  _id?: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface ILoan {
  _id: string;
  userId: string;
  friendName: string;
  amount: number;
  dateLent: string;
  dueDate: string;
  amountRepaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  notes?: string;
  receiptPath?: string;
  receiptOriginalName?: string;
  receiptMimeType?: string;
  repayments: IRepayment[];
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  phoneNumber: string;
  name?: string;
  createdAt: string;
}

export interface IDashboardSummary {
  totalLent: number;
  totalRepaid: number;
  outstandingAmount: number;
  overdueAmount: number;
  activeLoansCount: number;
  repaidLoansCount: number;
}

export interface CreateLoanPayload {
  friendName: string;
  amount: number;
  dateLent: string;
  dueDate: string;
  notes?: string;
}

export interface RecordRepaymentPayload {
  amount: number;
  notes?: string;
  date?: string;
}
