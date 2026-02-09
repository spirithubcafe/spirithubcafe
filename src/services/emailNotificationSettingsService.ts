import { http } from './apiClient';

export interface EmailNotificationSettingsDto {
  isEnabled: boolean;
  adminEmails: string;
  supportEmail: string;

  // Customer notifications
  customerOrderPlacedEnabled: boolean;
  customerOrderStatusChangedEnabled: boolean;
  customerPaymentStatusChangedEnabled: boolean;
  customerShippingUpdateEnabled: boolean;
  customerOrderCancelledEnabled: boolean;
  customerWelcomeEnabled: boolean;
  customerLoginSuccessEnabled: boolean;
  customerPasswordResetEnabled: boolean;
  customerPasswordChangedEnabled: boolean;

  // Admin notifications
  adminNewOrderEnabled: boolean;
  adminPaymentReceivedEnabled: boolean;
  adminOrderStatusChangedEnabled: boolean;
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

export const emailNotificationSettingsService = {
  /**
   * Get current email notification settings
   * @param branch Optional branch override (om/sa). If provided, sets X-Branch header.
   */
  get: async (branch?: string): Promise<EmailNotificationSettingsDto> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get<
      EmailNotificationSettingsDto | ApiEnvelope<EmailNotificationSettingsDto>
    >('/api/EmailNotificationSettings', config);
    return unwrap<EmailNotificationSettingsDto>(response.data);
  },

  /**
   * Update email notification settings
   * @param branch Optional branch override (om/sa). If provided, sets X-Branch header.
   */
  update: async (
    settings: EmailNotificationSettingsDto,
    branch?: string,
  ): Promise<EmailNotificationSettingsDto> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.put<
      EmailNotificationSettingsDto | ApiEnvelope<EmailNotificationSettingsDto>
    >('/api/EmailNotificationSettings', settings, config);
    return unwrap<EmailNotificationSettingsDto>(response.data);
  },
};
