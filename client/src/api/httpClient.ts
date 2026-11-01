import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import type { ApiError, ApiErrorPayload } from '../types/common.types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach bearer token
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: extract envelope or format ApiError
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ success?: boolean; error?: ApiErrorPayload }>) => {
    const status = error.response?.status || 500;
    const errorBody = error.response?.data?.error;

    const apiError: ApiError = {
      status,
      code: errorBody?.code || (status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR'),
      message:
        errorBody?.message ||
        error.message ||
        'An unexpected error occurred while communicating with the civic network.',
      fieldErrors: errorBody?.field_errors || {},
      requestId: errorBody?.request_id,
    };

    if (status === 401) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(apiError);
  }
);

