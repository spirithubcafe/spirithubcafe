import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '../types/auth';
import { safeStorage } from '../lib/safeStorage';
import { getActiveRegionForApi } from '../lib/regionUtils';

const getLoginRedirectUrl = (): string => {
  const path = window.location.pathname;
  const current = path + window.location.search;
  if (path.startsWith('/wholesale')) {
    return `/wholesale/login?redirect=${encodeURIComponent(current)}`;
  }
  const savedRegion = safeStorage.getItem('spirithub-region') || 'om';
  const loginPath = `/${savedRegion}/login`;
  return `${loginPath}?redirect=${encodeURIComponent(current)}`;
};

const isLoginRoute = (pathname: string): boolean => {
  return /^\/(om|sa)\/login\/?$/.test(pathname) || pathname === '/login' || /^\/wholesale\/login\/?$/.test(pathname);
};

// Get API Base URL based on current region
const getApiBaseUrl = (): string => {
  const savedRegion = getActiveRegionForApi();
  
  if (savedRegion === 'sa') {
    return import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }
  
  return import.meta.env.VITE_API_BASE_URL_OM || import.meta.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
};

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add auth token, branch header, and update baseURL
  client.interceptors.request.use(
    (config) => {
      // Dynamically set baseURL based on current region
      config.baseURL = getApiBaseUrl();
      
      // Add X-Branch header based on current region
      const currentRegion = getActiveRegionForApi();
      if (config.headers) {
        config.headers['X-Branch'] = currentRegion;
      }
      
      const token = safeStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Public endpoints are allowed without a token; logging this as a warning is noisy.
        if (import.meta.env.DEV) {
          console.debug('⚠️ No access token found for request:', config.url, '| Branch:', currentRegion);
        }
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
        // Keep the full response structure for endpoints that need pagination
        // Individual services will handle unwrapping as needed
        return response;
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 unauthorized errors
        if (error.response?.status === 401 && originalRequest?._retry) {
          // Already attempted refresh once; redirect to login.
          safeStorage.removeItem('accessToken');
          safeStorage.removeItem('refreshToken');
          safeStorage.removeItem('user');

          if (!isLoginRoute(window.location.pathname)) {
            window.location.href = getLoginRedirectUrl();
          }

          return Promise.reject(error);
        }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = safeStorage.getItem('refreshToken');
          if (refreshToken) {
            // Try to refresh the token
            const refreshResponse = await axios.post(`${getApiBaseUrl()}/api/Account/RefreshToken`, {
              refreshToken,
            });

            if (refreshResponse.data?.access_token) {
              safeStorage.setItem('accessToken', refreshResponse.data.access_token);
              safeStorage.setItem('refreshToken', refreshResponse.data.refresh_token);
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
              return client(originalRequest);
            }
          } else {
            console.warn('⚠️ No refresh token found in localStorage');

            // No refresh token means we cannot recover; redirect to login instead of surfacing 401s.
            safeStorage.removeItem('accessToken');
            safeStorage.removeItem('refreshToken');
            safeStorage.removeItem('user');

            if (!isLoginRoute(window.location.pathname)) {
              window.location.href = getLoginRedirectUrl();
            }
          }
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
          // Refresh failed, redirect to login
          safeStorage.removeItem('accessToken');
          safeStorage.removeItem('refreshToken');
          safeStorage.removeItem('user');
          
          // Only redirect if we're not already on the login page
          if (!isLoginRoute(window.location.pathname)) {
            window.location.href = getLoginRedirectUrl();
          }
          return Promise.reject(refreshError);
        }
      }

      // Transform error to standard format
      const apiError: ApiError = {
        message: error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred',
        statusCode: error.response?.status || 500,
        errors: error.response?.data?.errors || error.response?.data?.error,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create a public axios instance:
// - No auth token injection
// - No 401 refresh/redirect behavior
// This is useful for truly public endpoints (e.g., customer confirmation email)
// where we must avoid redirecting anonymous users to login.
const createPublicApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      config.baseURL = getApiBaseUrl();
      const currentRegion = getActiveRegionForApi();
      if (config.headers) {
        config.headers['X-Branch'] = currentRegion;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();
export const publicApiClient = createPublicApiClient();

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

// Public HTTP methods (no auth, no redirect)
export const publicHttp = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicApiClient.get(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicApiClient.post(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicApiClient.put(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicApiClient.patch(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicApiClient.delete(url, config),
};

// Helper functions for token management
export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string) => {
    safeStorage.setItem('accessToken', accessToken);
    safeStorage.setItem('refreshToken', refreshToken);
  },

  getAccessToken: (): string | null => {
    return safeStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    return safeStorage.getItem('refreshToken');
  },

  clearTokens: () => {
    safeStorage.removeItem('accessToken');
    safeStorage.removeItem('refreshToken');
    safeStorage.removeItem('user');
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
