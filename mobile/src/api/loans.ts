import { apiClient } from './client';
import {
  ILoan,
  CreateLoanPayload,
  RecordRepaymentPayload,
} from '../types';

export interface LoansQueryParams {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const loansApi = {
  async getLoans(params?: LoansQueryParams): Promise<ILoan[]> {
    const response = await apiClient.get<{ success: boolean; data: ILoan[] }>('/loans', {
      params,
    });
    return response.data.data;
  },

  async getLoanById(id: string): Promise<ILoan> {
    const response = await apiClient.get<{ success: boolean; data: ILoan }>(`/loans/${id}`);
    return response.data.data;
  },

  async createLoan(payload: CreateLoanPayload): Promise<ILoan> {
    const response = await apiClient.post<{ success: boolean; data: ILoan }>('/loans', payload);
    return response.data.data;
  },

  async recordRepayment(id: string, payload: RecordRepaymentPayload): Promise<ILoan> {
    const response = await apiClient.patch<{ success: boolean; data: ILoan }>(
      `/loans/${id}/repay`,
      payload
    );
    return response.data.data;
  },

  async deleteLoan(id: string): Promise<void> {
    await apiClient.delete(`/loans/${id}`);
  },

  async uploadReceipt(
    id: string,
    fileUri: string,
    fileName: string = 'receipt.jpg',
    mimeType: string = 'image/jpeg'
  ): Promise<ILoan> {
    const formData = new FormData();

    // Check if web environment (fetch blob) or native
    if (typeof window !== 'undefined' && (fileUri.startsWith('blob:') || fileUri.startsWith('data:'))) {
      const res = await fetch(fileUri);
      const blob = await res.blob();
      formData.append('receipt', blob, fileName);
    } else {
      formData.append('receipt', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const response = await apiClient.post<{ success: boolean; data: ILoan }>(
      `/loans/${id}/receipt`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};
