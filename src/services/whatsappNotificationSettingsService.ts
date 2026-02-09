import { http } from './apiClient';
import type {
  WhatsAppNotificationSettingsDto,
  WhatsAppNotificationSettingsResponse,
} from '../types/whatsapp';

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

/**
 * WhatsApp Notification Settings Service
 * Manages WhatsApp notification preferences for customers and admins
 */
export const whatsappNotificationSettingsService = {
  /**
   * Get current WhatsApp notification settings
   * @param branch Optional branch override (om/sa). If provided, sets X-Branch header.
   */
  get: async (branch?: string): Promise<WhatsAppNotificationSettingsResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get<
      WhatsAppNotificationSettingsResponse | ApiEnvelope<WhatsAppNotificationSettingsResponse>
    >('/api/whatsapp-notification-settings', config);
    return unwrap<WhatsAppNotificationSettingsResponse>(response.data);
  },

  /**
   * Update WhatsApp notification settings
   * @param branch Optional branch override (om/sa). If provided, sets X-Branch header.
   */
  update: async (
    settings: WhatsAppNotificationSettingsDto,
    branch?: string,
  ): Promise<WhatsAppNotificationSettingsResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.put<
      WhatsAppNotificationSettingsResponse | ApiEnvelope<WhatsAppNotificationSettingsResponse>
    >('/api/whatsapp-notification-settings', settings, config);
    return unwrap<WhatsAppNotificationSettingsResponse>(response.data);
  },
};
