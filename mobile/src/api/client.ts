import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

// Default development backend URLs
// For Web: localhost
// For Android Emulator: 10.0.2.2
// For Physical Device: replace with your development machine's local IP (e.g. 192.168.1.10)
const getDefaultApiBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator alias for host loopback
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export let API_BASE_URL = getDefaultApiBaseUrl();

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url;
  apiClient.defaults.baseURL = url;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  async (requestConfig) => {
    const token = await storage.getToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error message from backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Network connection error. Please check backend server.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.errors?.length > 0) {
      message = error.response.data.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
