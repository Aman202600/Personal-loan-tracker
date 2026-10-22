import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus } from '../utils/statusHelper';

export interface IRepayment {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  notes?: string;
}

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  friendName: string;
  amount: number;
  dateLent: Date;
  dueDate: Date;
  amountRepaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  notes?: string;
  receiptPath?: string;
  receiptOriginalName?: string;
  receiptMimeType?: string;
  repayments: IRepayment[];
  createdAt: Date;
  updatedAt: Date;
}

const RepaymentSchema = new Schema<IRepayment>(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Repayment amount must be greater than zero'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const LoanSchema = new Schema<ILoan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    friendName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Loan amount must be at least ₹1'],
    },
    dateLent: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amountRepaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'partially repaid', 'repaid', 'overdue'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receiptPath: {
      type: String,
      default: null,
    },
    receiptOriginalName: {
      type: String,
      default: null,
    },
    receiptMimeType: {
      type: String,
      default: null,
    },
    repayments: [RepaymentSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound indexes for user-scoped filtering and dashboard analytics
LoanSchema.index({ userId: 1, status: 1 });
LoanSchema.index({ userId: 1, dueDate: 1 });
LoanSchema.index({ userId: 1, createdAt: -1 });

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
