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
  sendText: (params: WhatsAppSendDto) => Promise<boolean>;
  sendImage: (params: WhatsAppSendImageDto) => Promise<boolean>;
  reset: () => void;
  formatPhone: (phone: string) => string;
  isValidPhone: (phone: string) => boolean;
}

/**
 * Hook for sending WhatsApp messages (Admin only)
 */
export const useWhatsApp = (): UseWhatsAppReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendText = useCallback(async (params: WhatsAppSendDto): Promise<boolean> => {
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
      const response = await whatsappService.sendMessage({
        ...params,
        phoneNumber: whatsappService.normalizePhoneNumber(params.phoneNumber),
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

  const sendImage = useCallback(async (params: WhatsAppSendImageDto): Promise<boolean> => {
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
      const response = await whatsappService.sendImage({
        ...params,
        phoneNumber: whatsappService.normalizePhoneNumber(params.phoneNumber),
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

  const formatPhone = useCallback((phone: string): string => {
    return whatsappService.formatPhoneDisplay(phone);
  }, []);

  const isValidPhone = useCallback((phone: string): boolean => {
    return whatsappService.isValidOmanPhone(phone);
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
