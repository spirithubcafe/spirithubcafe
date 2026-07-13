import { apiClient, publicHttp } from './apiClient';
import { personalizationService } from './personalizationService';
import { safeStorage } from '../lib/safeStorage';

export interface UnknownIntentTrackPayload {
  customerId?: number | null;
  sessionId?: string;
  message: string;
  language?: string;
  detectedIntent?: string | null;
  confidenceScore?: number | null;
  suggestedIntent?: string | null;
  suggestedKeywords?: string[];
  suggestedArabicKeywords?: string[];
  clickedProductId?: number | null;
  addedToCartProductId?: number | null;
  purchasedProductId?: number | null;
}

export interface ChatbotUnknownIntent extends Required<Pick<UnknownIntentTrackPayload, 'message'>> {
  id: number;
  customerId?: number | null;
  sessionId: string;
  language: string;
  detectedIntent?: string | null;
  confidenceScore?: number | null;
  suggestedIntent?: string | null;
  suggestedKeywords: string[];
  suggestedArabicKeywords: string[];
  clickedProductId?: number | null;
  addedToCartProductId?: number | null;
  purchasedProductId?: number | null;
  createdAt: string;
  reviewedAt?: string | null;
  approvedBy?: string | null;
  status: string;
  reviewNotes?: string | null;
}

export interface ChatbotIntent {
  id: number;
  intentCode: string;
  intentNameEn: string;
  intentNameAr?: string | null;
  isActive: boolean;
}

export interface UnknownIntentList {
  items: ChatbotUnknownIntent[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApproveUnknownIntentPayload {
  intentId?: number;
  intentCode?: string;
  intentNameEn?: string;
  intentNameAr?: string;
  keywordsEn: string[];
  keywordsAr: string[];
  reviewNotes?: string;
}

const CHATBOT_ATTRIBUTION_KEY = 'spirithub-chatbot-attribution';
const ATTRIBUTION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type ChatbotAttribution = { sessionId: string; productIds: number[]; updatedAt: string };

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const readAttribution = (): ChatbotAttribution | null => {
  try {
    const value = safeStorage.getItem(CHATBOT_ATTRIBUTION_KEY);
    return value ? JSON.parse(value) as ChatbotAttribution : null;
  } catch {
    return null;
  }
};

const rememberProduct = (productId?: number) => {
  const current = readAttribution();
  const productIds = new Set(current?.productIds ?? []);
  if (productId) productIds.add(productId);
  safeStorage.setItem(CHATBOT_ATTRIBUTION_KEY, JSON.stringify({
    sessionId: personalizationService.getSessionId(),
    productIds: [...productIds],
    updatedAt: new Date().toISOString(),
  } satisfies ChatbotAttribution));
};

export const chatbotIntentService = {
  trackUnknown: (payload: UnknownIntentTrackPayload): void => {
    void publicHttp.post('/api/chatbot-intents/unknown', {
      ...payload,
      sessionId: payload.sessionId ?? personalizationService.getSessionId(),
      suggestedKeywords: payload.suggestedKeywords ?? [],
      suggestedArabicKeywords: payload.suggestedArabicKeywords ?? [],
    }, { timeout: 5000 }).catch(() => undefined);
  },

  trackRecommendationShown: (productIds: number[], language: string, country: string, message: string): void => {
    productIds.forEach(rememberProduct);
    personalizationService.trackEvent({
      eventType: 'CHATBOT_RECOMMENDATION_SHOWN', language, country, source: 'chatbot',
      metadata: { chatbotMessage: message, productIds },
    });
  },

  trackProductClick: (productId: number, language: string, country: string, metadata?: Record<string, unknown>): void => {
    rememberProduct(productId);
    personalizationService.trackEvent({ eventType: 'CHATBOT_PRODUCT_CLICK', productId, language, country, source: 'chatbot', metadata });
  },

  trackAddToCart: (productId: number, language: string, country: string, metadata?: Record<string, unknown>): void => {
    rememberProduct(productId);
    personalizationService.trackEvent({ eventType: 'CHATBOT_ADD_TO_CART', productId, language, country, source: 'chatbot', metadata });
  },

  trackPurchaseIfAttributed: (orderId: string, language: string, country: string): void => {
    const attribution = readAttribution();
    if (!attribution) return;
    if (Date.now() - new Date(attribution.updatedAt).getTime() > ATTRIBUTION_MAX_AGE_MS) {
      safeStorage.removeItem(CHATBOT_ATTRIBUTION_KEY);
      return;
    }
    personalizationService.trackEvent({
      eventType: 'CHATBOT_PURCHASE', language, country, source: 'chatbot',
      metadata: { orderId, productIds: attribution.productIds, chatbotSessionId: attribution.sessionId },
    });
    safeStorage.removeItem(CHATBOT_ATTRIBUTION_KEY);
  },

  getUnknown: async (status = 'Pending', page = 1, pageSize = 25): Promise<UnknownIntentList> => {
    const response = await apiClient.get('/api/chatbot-intents/unknown', { params: { status, page, pageSize } });
    return unwrap<UnknownIntentList>(response.data);
  },

  getIntents: async (): Promise<ChatbotIntent[]> => {
    const response = await apiClient.get('/api/chatbot-intents', { params: { includeInactive: false } });
    return unwrap<ChatbotIntent[]>(response.data);
  },

  approve: async (id: number, payload: ApproveUnknownIntentPayload): Promise<void> => {
    await apiClient.post(`/api/chatbot-intents/unknown/${id}/approve`, payload);
  },

  updateStatus: async (id: number, status: 'Rejected' | 'Ignored', reviewNotes?: string): Promise<void> => {
    await apiClient.post(`/api/chatbot-intents/unknown/${id}/status`, { status, reviewNotes });
  },
};
