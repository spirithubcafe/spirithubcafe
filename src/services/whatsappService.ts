import { http, publicHttp } from './apiClient';
import type {
  PhoneOtpRequestDto,
  PhoneOtpVerifyDto,
  PhoneOtpRequestResponse,
  PhoneOtpVerifyResponse,
  WhatsAppSendDto,
  WhatsAppSendImageDto,
  WhatsAppSendResponse,
} from '../types/whatsapp';

/**
 * WhatsApp Service
 * Handles phone OTP authentication and admin message sending
 */
export const whatsappService = {
  /**
   * Request OTP code sent via WhatsApp
   * @param data Phone number to send OTP to
   */
  requestOtp: async (data: PhoneOtpRequestDto): Promise<PhoneOtpRequestResponse> => {
    try {
      // Use publicHttp since this endpoint doesn't require authentication
      const response = await publicHttp.post<PhoneOtpRequestResponse>(
        '/api/Account/phone-otp/request',
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Verify OTP code and login/register
   * @param data Phone number and OTP code
   */
  verifyOtp: async (data: PhoneOtpVerifyDto): Promise<PhoneOtpVerifyResponse> => {
    try {
      // Use publicHttp since this endpoint doesn't require authentication
      const response = await publicHttp.post<PhoneOtpVerifyResponse>(
        '/api/Account/phone-otp/verify',
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Send WhatsApp text message (Admin only)
   * @param data Phone number and message
   */
  sendMessage: async (data: WhatsAppSendDto): Promise<WhatsAppSendResponse> => {
    try {
      const response = await http.post<WhatsAppSendResponse>(
        '/api/whatsapp/send',
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Send WhatsApp image with optional caption (Admin only)
   * @param data Phone number, image URL, and optional caption
   */
  sendImage: async (data: WhatsAppSendImageDto): Promise<WhatsAppSendResponse> => {
    try {
      const response = await http.post<WhatsAppSendResponse>(
        '/api/whatsapp/send-image',
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Normalize phone number to international format (digits only, with country code)
   * @param phone  – The local phone digits (without country code)
   * @param countryDialCode – e.g. "+968", "+971"
   */
  normalizePhoneNumber: (phone: string, countryDialCode?: string): string => {
    const digits = phone.replace(/\D/g, '');
    const dialDigits = (countryDialCode ?? '+968').replace(/\D/g, '');

    // Already contains country code
    if (digits.startsWith(dialDigits)) {
      return digits;
    }

    return `${dialDigits}${digits}`;
  },

  /**
   * Format phone number for display
   * @param phone  – local digits
   * @param countryDialCode – e.g. "+968"
   */
  formatPhoneDisplay: (phone: string, countryDialCode?: string): string => {
    const digits = phone.replace(/\D/g, '');
    const dial = countryDialCode ?? '+968';
    const dialDigits = dial.replace(/\D/g, '');

    // Strip country code if present
    const local = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;

    // Group in 4-digit blocks
    const parts: string[] = [];
    for (let i = 0; i < local.length; i += 4) {
      parts.push(local.slice(i, i + 4));
    }
    return `${dial} ${parts.join(' ')}`.trim();
  },

  /**
   * Validate phone number based on country config
   * @param phone – local digits (no country code)
   * @param maxDigits – expected digit count for the country
   * @param startsWith – optional: first digit must match
   */
  isValidPhone: (phone: string, maxDigits: number = 8, startsWith?: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== maxDigits) return false;
    if (startsWith && !digits.startsWith(startsWith)) return false;
    return true;
  },

  /**
   * Legacy: Validate Oman phone number (kept for backward-compatibility)
   */
  isValidOmanPhone: (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 8 && digits.startsWith('9')) return true;
    if (digits.length === 11 && digits.startsWith('968') && digits[3] === '9') return true;
    return false;
  },
};
