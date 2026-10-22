import { apiClient } from './client';
import { IUser } from '../types';

export interface RequestOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: IUser;
  };
}

export const authApi = {
  async requestOtp(phoneNumber: string): Promise<RequestOtpResponse> {
    const response = await apiClient.post<RequestOtpResponse>('/auth/otp/request', {
      phoneNumber,
    });
    return response.data;
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<VerifyOtpResponse> {
    const response = await apiClient.post<VerifyOtpResponse>('/auth/otp/verify', {
      phoneNumber,
      otp,
    });
    return response.data;
  },

  async getMe(): Promise<{ user: IUser }> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },
};
