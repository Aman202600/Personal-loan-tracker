import { z } from 'zod';

export const createLoanSchema = z
  .object({
    friendName: z
      .string({ required_error: "Friend's name is required" })
      .trim()
      .min(1, "Friend's name cannot be empty")
      .max(100, "Friend's name must be under 100 characters"),
    amount: z
      .number({ required_error: 'Loan amount is required', invalid_type_error: 'Loan amount must be a number' })
      .positive('Loan amount must be greater than 0')
      .max(100000000, 'Loan amount is too large'),
    dateLent: z
      .string({ required_error: 'Date lent is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date lent format',
      }),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid due date format',
      }),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().default(''),
  })
  .refine(
    (data) => {
      const lent = new Date(data.dateLent).getTime();
      const due = new Date(data.dueDate).getTime();
      return due >= lent;
    },
    {
      message: 'Due date must be on or after the date lent',
      path: ['dueDate'],
    }
  );

export const recordRepaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Repayment amount is required', invalid_type_error: 'Repayment amount must be a number' })
    .positive('Repayment amount must be greater than 0')
    .max(100000000, 'Repayment amount exceeds maximum limit'),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid repayment date format',
    }),
  notes: z.string().max(500, 'Repayment notes cannot exceed 500 characters').optional().default(''),
});

export const queryLoansSchema = z.object({
  status: z.enum(['all', 'pending', 'partially repaid', 'repaid', 'overdue']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'amount', 'createdAt', 'friendName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type RecordRepaymentInput = z.infer<typeof recordRepaymentSchema>;
export type QueryLoansInput = z.infer<typeof queryLoansSchema>;
