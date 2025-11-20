import { useState } from 'react';
import { emailService } from '../services/emailService';
import type {
  SendEmailDto,
  SendBulkEmailDto,
  TestEmailSettingsDto,
  EmailSendResponseDto,
} from '../services/emailService';

interface UseEmailSenderResult {
  sendEmail: (data: SendEmailDto) => Promise<EmailSendResponseDto>;
  sendBulkEmail: (data: SendBulkEmailDto) => Promise<EmailSendResponseDto>;
  sendTestEmail: (data: TestEmailSettingsDto) => Promise<EmailSendResponseDto>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom hook for sending emails with loading and error states
 * @returns Email sender functions and state
 */
export const useEmailSender = (): UseEmailSenderResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const sendEmail = async (data: SendEmailDto): Promise<EmailSendResponseDto> => {
    setLoading(true);
    setError(null);

    try {
      const result = await emailService.sendSingleEmail(data);
      
      if (!result.success) {
        const errorMsg = result.errors?.join(', ') || result.message;
        setError(errorMsg);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEmail = async (data: SendBulkEmailDto): Promise<EmailSendResponseDto> => {
    setLoading(true);
    setError(null);

    try {
      const result = await emailService.sendBulkEmail(data);
      
      if (!result.success && result.failedCount > 0) {
        const errorMsg = result.errors?.join(', ') || result.message;
        setError(errorMsg);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send bulk email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (data: TestEmailSettingsDto): Promise<EmailSendResponseDto> => {
    setLoading(true);
    setError(null);

    try {
      const result = await emailService.sendTestEmail(data);
      
      if (!result.success) {
        const errorMsg = result.errors?.join(', ') || result.message;
        setError(errorMsg);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send test email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    sendBulkEmail,
    sendTestEmail,
    loading,
    error,
    clearError,
  };
};
