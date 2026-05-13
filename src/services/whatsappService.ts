import { http, publicHttp } from './apiClient';
import type {
  PhoneOtpRequestDto,
  PhoneOtpVerifyDto,
  PhoneOtpRequestResponse,
  WhatsAppActivationAssetResult,
  WhatsAppActivationAssetType,
  WhatsAppActivationLoadResult,
  PhoneOtpVerifyResponse,
  WhatsAppSendDto,
  WhatsAppSendImageDto,
  WhatsAppSendResponse,
} from '../types/whatsapp';

const parseBlobError = async (blob: Blob): Promise<{ message?: string; error?: string } | null> => {
  try {
    const text = await blob.text();
    if (!text) {
      return null;
    }

    return JSON.parse(text) as { message?: string; error?: string };
  } catch {
    return null;
  }
};

const getSessionPath = (session?: string | null): string => {
  const value = session?.trim();
  return value ? `/api/WhatsApp/${encodeURIComponent(value)}` : '/api/WhatsApp';
};

const getActivationMessage = (
  assetType: WhatsAppActivationAssetType,
  isArabic: boolean,
): string => {
  if (assetType === 'qr') {
    return isArabic
      ? 'امسح رمز QR من واتساب على الهاتف لإكمال التفعيل.'
      : 'Scan the QR code with WhatsApp on the phone to complete activation.';
  }

  return isArabic
    ? 'جلسة واتساب مفعلة بالفعل. هذه لقطة حية من WhatsApp Web.'
    : 'The WhatsApp session is already active. This is a live WhatsApp Web screenshot.';
};

const getActivationErrorMessage = (
  fallback: string,
  isArabic: boolean,
  error: { message?: string; error?: string } | null,
): string => {
  return error?.message || error?.error || fallback || (isArabic ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
};

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

  fetchActivationAsset: async (
    assetType: WhatsAppActivationAssetType,
    session?: string | null,
  ): Promise<WhatsAppActivationAssetResult> => {
    const response = await http.get<Blob>(
      `${getSessionPath(session)}/${assetType === 'qr' ? 'auth/qr' : 'screenshot'}`,
      {
        headers: {
          Accept: assetType === 'qr' ? 'image/png' : 'image/jpeg',
        },
        responseType: 'blob',
        validateStatus: () => true,
      },
    );

    const contentType = String(response.headers['content-type'] || '');
    if (response.status >= 200 && response.status < 300 && contentType.startsWith('image/')) {
      return {
        ok: true,
        status: response.status,
        imageUrl: URL.createObjectURL(response.data),
        contentType,
      };
    }

    return {
      ok: false,
      status: response.status,
      error: await parseBlobError(response.data),
    };
  },

  loadActivationImage: async (
    session: string | null | undefined,
    isArabic = false,
  ): Promise<WhatsAppActivationLoadResult> => {
    const normalizedSession = session?.trim() || null;
    const qrResult = await whatsappService.fetchActivationAsset('qr', normalizedSession);

    if (qrResult.ok) {
      return {
        type: 'qr',
        imageUrl: qrResult.imageUrl,
        message: getActivationMessage('qr', isArabic),
        session: normalizedSession,
        status: qrResult.status,
      };
    }

    if (qrResult.status !== 422) {
      return {
        type: 'error',
        message: getActivationErrorMessage(
          isArabic ? 'بارگذاری QR واتس‌اپ انجام نشد.' : 'Unable to load the WhatsApp QR code.',
          isArabic,
          qrResult.error,
        ),
        session: normalizedSession,
        status: qrResult.status,
      };
    }

    const screenshotResult = await whatsappService.fetchActivationAsset('screenshot', normalizedSession);
    if (!screenshotResult.ok) {
      return {
        type: 'error',
        message: getActivationErrorMessage(
          isArabic ? 'بارگذاری اسکرین‌شات جلسه واتس‌اپ انجام نشد.' : 'Unable to load the WhatsApp session screenshot.',
          isArabic,
          screenshotResult.error,
        ),
        session: normalizedSession,
        status: screenshotResult.status,
      };
    }

    return {
      type: 'screenshot',
      imageUrl: screenshotResult.imageUrl,
      message: getActivationMessage('screenshot', isArabic),
      session: normalizedSession,
      status: screenshotResult.status,
    };
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
    if (startsWith) {
      const prefixes = startsWith
        .split(/[|,/\s]+/)
        .map((part) => part.replace(/\D/g, ''))
        .filter(Boolean);
      if (prefixes.length > 0 && !prefixes.some((prefix) => digits.startsWith(prefix))) return false;
    }
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
