import { http } from './apiClient';

export interface EmailSettingsDto {
  id: number;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  isDefault: boolean;

  imapServer: string;
  imapPort: number;
  imapUseSsl: boolean;
  imapUsername: string;
  imapPassword?: string | null;

  smtpServer: string;
  smtpPort: number;
  smtpUseSsl: boolean;
  smtpUseStartTls: boolean;
  smtpUsername: string;
  smtpPassword?: string | null;

  senderName: string;
  senderEmail: string;
  replyToEmail?: string | null;
  bccEmails?: string | null;

  maxEmailsPerHour?: number | null;
  timeoutSeconds?: number | null;

  createdAt?: string;
  updatedAt?: string;
  lastTestedAt?: string | null;
  lastTestResult?: string | null;
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const unwrap = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

export const emailSettingsService = {
  /**
   * Get all email settings (Admin only)
   */
  getAll: async (): Promise<EmailSettingsDto[]> => {
    const response = await http.get<EmailSettingsDto[] | ApiEnvelope<EmailSettingsDto[]>>(
      '/api/EmailSettings'
    );
    return unwrap<EmailSettingsDto[]>(response.data);
  },

  /**
   * Create or update email settings.
   * Most backends use POST for create and PUT for update.
   */
  save: async (settings: Partial<EmailSettingsDto>): Promise<unknown> => {
    const id = typeof settings.id === 'number' ? settings.id : undefined;

    if (id) {
      const response = await http.put<unknown>(`/api/EmailSettings/${id}`, settings);
      return unwrap<unknown>(response.data);
    }

    const response = await http.post<unknown>('/api/EmailSettings', settings);
    return unwrap<unknown>(response.data);
  },
};
