import { useState, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';
import type {
  WhatsAppSendDto,
  WhatsAppSendImageDto,
} from '../types/whatsapp';

interface UseWhatsAppReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  sendText: (params: WhatsAppSendDto & { countryDialCode?: string }) => Promise<boolean>;
  sendImage: (params: WhatsAppSendImageDto & { countryDialCode?: string }) => Promise<boolean>;
  reset: () => void;
  formatPhone: (phone: string, countryDialCode?: string) => string;
  isValidPhone: (phone: string, maxDigits?: number, startsWith?: string) => boolean;
}

/**
 * Hook for sending WhatsApp messages (Admin only)
 */
export const useWhatsApp = (): UseWhatsAppReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendText = useCallback(async (params: WhatsAppSendDto & { countryDialCode?: string }): Promise<boolean> => {
    if (!params.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!params.message.trim()) {
      setError('Message is required');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { countryDialCode, ...sendParams } = params;
      const response = await whatsappService.sendMessage({
        ...sendParams,
        phoneNumber: whatsappService.normalizePhoneNumber(params.phoneNumber, countryDialCode),
      });

      if (response.success) {
        setSuccess(true);
        return true;
      } else {
        setError(response.message || 'Failed to send message');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendImage = useCallback(async (params: WhatsAppSendImageDto & { countryDialCode?: string }): Promise<boolean> => {
    if (!params.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!params.imageUrl.trim()) {
      setError('Image URL is required');
      return false;
    }

    // Basic URL validation
    try {
      new URL(params.imageUrl);
    } catch {
      setError('Please enter a valid image URL');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { countryDialCode, ...sendParams } = params;
      const response = await whatsappService.sendImage({
        ...sendParams,
        phoneNumber: whatsappService.normalizePhoneNumber(params.phoneNumber, countryDialCode),
      });

      if (response.success) {
        setSuccess(true);
        return true;
      } else {
        setError(response.message || 'Failed to send image');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const formatPhone = useCallback((phone: string, countryDialCode?: string): string => {
    return whatsappService.formatPhoneDisplay(phone, countryDialCode);
  }, []);

  const isValidPhone = useCallback((phone: string, maxDigits: number = 8, startsWith?: string): boolean => {
    return whatsappService.isValidPhone(phone, maxDigits, startsWith);
  }, []);

  return {
    loading,
    error,
    success,
    sendText,
    sendImage,
    reset,
    formatPhone,
    isValidPhone,
  };
};
