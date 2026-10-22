import { apiClient } from './client';
import { IDashboardSummary } from '../types';

export const summaryApi = {
  async getSummary(): Promise<IDashboardSummary> {
    const response = await apiClient.get<{ success: boolean; data: IDashboardSummary }>(
      '/summary'
    );
    return response.data.data;
  },
};
