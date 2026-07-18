import { apiClient } from './apiClient';

export interface WhatsAppProductReminderPreference {
  enabled: boolean;
  optedInAt?: string | null;
  optedOutAt?: string | null;
  hasPhoneNumber: boolean;
}

const endpoint = '/api/whatsapp-product-reminders/preference';

export const whatsAppProductReminderService = {
  getPreference: async (): Promise<WhatsAppProductReminderPreference> => {
    const response = await apiClient.get<WhatsAppProductReminderPreference>(endpoint);
    return response.data;
  },

  updatePreference: async (enabled: boolean): Promise<WhatsAppProductReminderPreference> => {
    const response = await apiClient.put<WhatsAppProductReminderPreference>(endpoint, { enabled });
    return response.data;
  },
};
