import axios from 'axios';
import type {
  PasswordResetResponse
} from '../types/passwordReset';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://spirithubapi.sbc.om';
const API_BASE = `${API_BASE_URL}/api/PasswordReset`;

export const passwordResetService = {
  /**
   * Request password reset
   * @param email - User's email address
   * @returns API response
   */
  forgotPassword: async (email: string): Promise<PasswordResetResponse> => {
    const response = await axios.post<PasswordResetResponse>(
      `${API_BASE}/forgot-password`,
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
      `${API_BASE}/verify-token`,
      { token }
    );
    return response.data;
  },

  /**
   * Set new password
   * @param token - Reset token
   * @param newPassword - New password
   * @returns API response
   */
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<PasswordResetResponse> => {
    const response = await axios.post<PasswordResetResponse>(
      `${API_BASE}/reset-password`,
      { token, newPassword }
    );
    return response.data;
  }
};
