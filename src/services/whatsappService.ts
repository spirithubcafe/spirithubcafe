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
   * Normalize phone number to international format
   * Supports Oman phone numbers (8 digits starting with 9)
   */
  normalizePhoneNumber: (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If 8 digits (Oman local format), add country code
    if (digits.length === 8) {
      return `968${digits}`;
    }
    
    // If starts with 968 and has correct length
    if (digits.startsWith('968') && digits.length === 11) {
      return digits;
    }
    
    // Return as-is for other formats
    return digits;
  },

  /**
   * Format phone number for display
   */
  formatPhoneDisplay: (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 8) {
      return `+968 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    if (digits.length === 11 && digits.startsWith('968')) {
      return `+968 ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }
    return phone;
  },

  /**
   * Validate Oman phone number
   */
  isValidOmanPhone: (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    // 8 digit Oman number starting with 9
    if (digits.length === 8 && digits.startsWith('9')) {
      return true;
    }
    // 11 digit with country code
    if (digits.length === 11 && digits.startsWith('968') && digits[3] === '9') {
      return true;
    }
    return false;
  },
};
