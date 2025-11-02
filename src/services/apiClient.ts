import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '../types/auth';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://spirithubapi.sbc.om';

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Unwrap API response if it has the {success, data} structure
      if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
        response.data = response.data.data;
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshResponse = await client.post('/api/Account/RefreshToken', {
              refreshToken
            });

            if (refreshResponse.data?.accessToken) {
              localStorage.setItem('accessToken', refreshResponse.data.accessToken);
              if (refreshResponse.data?.refreshToken) {
                localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
              }

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Dispatch custom event for auth state change
          window.dispatchEvent(new CustomEvent('auth-logout'));
          
          return Promise.reject(refreshError);
        }
      }

      // Transform error to standard format
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        statusCode: error.response?.status || 500,
        errors: error.response?.data?.errors,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// HTTP methods helpers
export const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
};

// Helper functions for token management
export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  isTokenExpired: (token: string): boolean => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const isExpired = expirationTime < currentTime;
      
      // Debug log for token expiration
      if (isExpired) {
        console.warn('Token expired:', {
          expiration: new Date(expirationTime).toISOString(),
          current: new Date(currentTime).toISOString()
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },
};
