import { apiClient } from './apiClient';

export interface ChatbotMarketingTotals {
  sessions: number;
  messages: number;
  recommendations: number;
  productClicks: number;
  addToCarts: number;
  purchases: number;
  noResults: number;
  giftInterest: number;
  wholesaleInterest: number;
}

export interface ChatbotMarketingSourceRow {
  source: string;
  sessions: number;
  recommendations: number;
  productClicks: number;
  addToCarts: number;
  purchases: number;
}

export interface ChatbotMarketingCampaignRow extends ChatbotMarketingSourceRow {
  campaign: string;
}

export interface ChatbotMarketingSummary {
  periodDays: number;
  fromUtc: string;
  generatedAtUtc: string;
  totals: ChatbotMarketingTotals;
  funnel: {
    recommendationToClickRate: number;
    clickToCartRate: number;
    cartToPurchaseRate: number;
  };
  sources: ChatbotMarketingSourceRow[];
  campaigns: ChatbotMarketingCampaignRow[];
  noResultSearches: Array<{ term: string; count: number }>;
}

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const chatbotMarketingAnalyticsService = {
  getSummary: async (days = 30): Promise<ChatbotMarketingSummary> => {
    const safeDays = Math.max(1, Math.min(90, Math.trunc(days || 30)));
    const response = await apiClient.get('/api/admin/chatbot-marketing/summary', {
      params: { days: safeDays },
    });
    return unwrap<ChatbotMarketingSummary>(response.data);
  },
};
