import axios from 'axios';
import type {
  PasswordResetResponse
} from '../types/passwordReset';

/**
 * Get the API base URL based on current region
 */
const getApiBaseUrl = (): string => {
  const savedRegion = localStorage.getItem('spirithub-region') || 'om';
  
  if (savedRegion === 'sa') {
    return import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }
  
  return import.meta.env.VITE_API_BASE_URL_OM || import.meta.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
};

const getApiBase = () => `${getApiBaseUrl()}/api/PasswordReset`;

export const passwordResetService = {
  /**
   * Request password reset
   * @param email - User's email address
   * @returns API response
   */
  forgotPassword: async (email: string): Promise<PasswordResetResponse> => {
    const response = await axios.post<PasswordResetResponse>(
      `${getApiBase()}/forgot-password`,
      { email }
    );
    return response.data;
  },

  /**
   * Verify reset token validity (optional)
   * @param token - Reset token
   * @returns API response with token information
   */
  verifyToken: async (token: string): Promise<PasswordResetResponse> => {
    const response = await axios.post<PasswordResetResponse>(
      `${getApiBase()}/verify-token`,
      { token }
    );
    return response.data;
  },

  /**
   * Set new password
   * @param token - Reset token
   * @param newPassword - New password
   * @param confirmPassword - Confirm new password
   * @returns API response
   */
  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<PasswordResetResponse> => {
    const response = await axios.post<PasswordResetResponse>(
      `${getApiBase()}/reset-password`,
      { token, newPassword, confirmPassword }
    );
    return response.data;
  }
};
