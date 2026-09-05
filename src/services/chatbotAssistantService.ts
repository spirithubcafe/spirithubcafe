import { publicHttp } from './apiClient';
import { resolveChatbotAssistantLocally } from './chatbotAssistantResolver';

export type ChatbotAssistantAction =
  | 'clarify'
  | 'track_order'
  | 'show_reorders'
  | 'build_bundle'
  | 'show_passport'
  | 'contact_support'
  | 'recommend_products'
  | 'start_quiz';

export interface ChatbotAssistantQuickAction {
  id: string;
  labelEn: string;
  labelAr: string;
}

export interface ChatbotAssistantResult {
  intent: string;
  confidence: number;
  requiresAuthentication: boolean;
  replyEn: string;
  replyAr: string;
  action: ChatbotAssistantAction;
  endpoint?: string | null;
  httpMethod: string;
  quickActions: ChatbotAssistantQuickAction[];
}

const unwrap = (payload: unknown): ChatbotAssistantResult | null => {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as { data?: unknown };
  const value = (envelope.data ?? payload) as Partial<ChatbotAssistantResult>;
  return typeof value.intent === 'string' && typeof value.action === 'string'
    ? value as ChatbotAssistantResult
    : null;
};

export const chatbotAssistantService = {
  resolve: async (message: string, language: string): Promise<ChatbotAssistantResult | null> => {
    try {
      const response = await publicHttp.post('/api/chatbot-assistant/resolve', { message, language }, { timeout: 4000 });
      return unwrap(response.data);
    } catch {
      // Keep transactional storefront jobs deterministic even when the additive
      // assistant endpoint has not been deployed. Only a true local miss reaches Gemini.
      return resolveChatbotAssistantLocally(message);
    }
  },
};
