import type { ChatbotAssistantAction, ChatbotAssistantQuickAction, ChatbotAssistantResult } from './chatbotAssistantService';
import { normalizeForMatch } from '../lib/chatbotProductIntents.ts';

/** Features this client can render. The backend returns Phase 2A intents only to clients that declare this. */
export const ASSISTANT_CAPABILITIES = ['assistant-2a'] as const;

type LocalRoute = Omit<ChatbotAssistantResult, 'confidence' | 'quickActions'> & {
  terms: RegExp;
  /** Phase 2A mirror routes are written against normalized text (Arabic ه/ة, ى/ي, hamza and diacritics folded). */
  normalized?: boolean;
  quickActions?: ChatbotAssistantQuickAction[];
};

const action = (id: string, labelEn: string, labelAr: string): ChatbotAssistantQuickAction => ({ id, labelEn, labelAr });

const ROUTES: LocalRoute[] = [
  // Phase 2A offline mirror (used only when the backend call fails). Same intent/action names as the backend router.
  {
    intent: 'complaint', action: 'contact_support', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'I’m sorry to hear that. I can connect you with customer support.', replyAr: 'نأسف لسماع ذلك. يمكنني توصيلك بخدمة العملاء.',
    terms: /\b(complain|complaints?|complaining)\b|شكوي|شكاوي|اشتكي|اشكو/,
    normalized: true,
  },
  {
    intent: 'sensitive_support', action: 'contact_support', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'Our team can help you with this directly.', replyAr: 'يمكن لفريقنا مساعدتك في هذا الطلب مباشرة.',
    terms: /\b(refunds?|refunded|returns?|returning|cancellation|allerg\w*)\b|money back|cancel\w* (my |the |an |this )?order|order cancel\w*|payment (problem|issue|failed|error)|charged twice|استرجاع|استرداد|ارجاع|مرتجع|الغاء (ال)?طلب|الغي (ال)?طلب|حساسيه/,
    normalized: true,
  },
  {
    intent: 'coffee_quiz', action: 'start_quiz', endpoint: '/api/coffee-quiz/start', httpMethod: 'POST', requiresAuthentication: false,
    replyEn: 'Let’s start a quick coffee quiz to find your best match.', replyAr: 'لنبدأ اختبار قهوة سريعاً لنجد الأنسب لك.',
    terms: /coffee quiz|taste quiz|start and finish.*quiz|help me choose|not sure what coffee|اختبار القهوة|اختبار قهوة|ساعدني أختار|ساعدني اختار/i,
    quickActions: [action('start_quiz', 'Start the coffee quiz', 'ابدأ اختبار القهوة')],
  },
  {
    intent: 'bundle', action: 'build_bundle', endpoint: '/api/ai-bundle-builder/create', httpMethod: 'POST', requiresAuthentication: false,
    replyEn: 'Tell me your budget, brew method, quantity, and flavors, and I’ll build your bundle.', replyAr: 'أخبرني بالميزانية وطريقة التحضير والكمية والنكهات وسأجهز لك الباقة.',
    terms: /build.*bundle|bundle|gift box|gift bundle|build a box|باقة|بوكس|هدية|هديه/i,
    quickActions: [action('set_budget', 'Set my budget', 'حدد ميزانيتي'), action('gift_bundle', 'Make it a gift', 'اجعلها هدية')],
  },
  {
    intent: 'order_status', action: 'track_order', endpoint: '/api/Orders/my-order/{orderId}', httpMethod: 'GET', requiresAuthentication: true,
    replyEn: 'I can help you check your order and delivery status.', replyAr: 'يمكنني مساعدتك في التحقق من حالة الطلب والتوصيل.',
    terms: /track (?:an?|my) order|order status|where is my order|delivery status|signed in.*order|order.*signed in|تتبع الطلب|حالة الطلب|وين طلبي|طلبي وين/i,
    quickActions: [action('track_order', 'View my orders', 'عرض طلباتي'), action('contact_support', 'Contact support', 'تواصل مع الدعم')],
  },
  {
    intent: 'smart_reorder', action: 'show_reorders', endpoint: '/api/smart-reorder/suggestions', httpMethod: 'GET', requiresAuthentication: true,
    replyEn: 'I’ll check which of your usual coffees may be ready to reorder.', replyAr: 'سأتحقق من القهوة المعتادة التي قد ترغب في إعادة طلبها.',
    terms: /smart reorder|reorder|order again|my usual|buy again|إعادة الطلب|اطلب مرة ثانية|طلبي المعتاد/i,
  },
  {
    intent: 'coffee_passport', action: 'show_passport', endpoint: '/api/coffee-passport/profile', httpMethod: 'GET', requiresAuthentication: true,
    replyEn: 'Let’s open your Coffee Passport and see your discoveries.', replyAr: 'لنفتح جواز القهوة ونشاهد اكتشافاتك.',
    terms: /coffee passport|passport|achievements|coffee journey|جواز القهوة|إنجازات|رحلة القهوة/i,
  },
  {
    intent: 'human_support', action: 'contact_support', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'I can connect you with customer support.', replyAr: 'يمكنني توصيلك بخدمة العملاء.',
    terms: /human|agent|customer service|support|complaint|موظف|خدمة العملاء|الدعم|شكوى/i,
    quickActions: [action('contact_support', 'Contact support', 'تواصل مع الدعم')],
  },
  {
    intent: 'store_hours', action: 'show_store_hours', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'Here are our opening hours.', replyAr: 'هذه ساعات العمل لدينا.',
    terms: /opening (hours|times?)|working hours|business hours|(store|shop|cafe) hours|closing time|what time.*(open|clos)|when.*\b(open|close)\b|are you (still )?(open|closed)|do you (open|close)|ساعات (ال)?(عمل|دوام)|اوقات (ال)?(عمل|دوام)|مواعيد (ال)?(عمل|دوام)|تفتح|تقفل|تغلق|مفتوح|مغلق|الدوام/,
    normalized: true,
  },
  {
    intent: 'delivery_info', action: 'show_delivery_info', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'I can share our delivery information.', replyAr: 'يمكنني مشاركة معلومات التوصيل.',
    terms: /\b(deliver\w*|shipping|ships?|courier)\b|توصيل|توصلون|توصل|يوصل|شحن|تشحن/,
    normalized: true,
  },
  {
    intent: 'store_location', action: 'show_store_location', endpoint: null, httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'Here is where you can find us.', replyAr: 'هنا يمكنك العثور علينا.',
    terms: /\b(location|located|directions|maps?|branch(es)?)\b|where .*\b(you|your|shop|store|cafe|roastery)\b|(وين|فين|اين) .*(محلكم|مكانكم|فرعكم|موقعكم|مقهي)|موقع|عنوانكم|فرع|خريطه/,
    normalized: true,
  },
  {
    intent: 'product_discovery', action: 'recommend_products', endpoint: '/api/recommendations/for-you', httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'I’ll help you find coffee that matches your taste and brew method.', replyAr: 'سأساعدك في إيجاد قهوة تناسب ذوقك وطريقة تحضيرك.',
    terms: /recommend.*coffee|find.*coffee|fruity coffee|espresso coffee|filter coffee|v60 coffee|coffee recommendation|رشح.*قهوة|اختر.*قهوة|قهوة فاكهية|قهوة.*فلتر|قهوة.*اسبريسو/i,
    quickActions: [action('start_quiz', 'Take the coffee quiz', 'ابدأ اختبار القهوة'), action('view_recommendations', 'Show recommendations', 'اعرض الترشيحات')],
  },
];

export const resolveChatbotAssistantLocally = (message: string): ChatbotAssistantResult | null => {
  const collapsed = message.trim().replace(/\s+/g, ' ');
  const folded = normalizeForMatch(message);
  const route = ROUTES.find((candidate) => candidate.terms.test(candidate.normalized ? folded : collapsed));
  if (!route) return null;
  const { terms: _terms, normalized: _normalized, quickActions = [], ...result } = route;
  void _terms;
  void _normalized;
  return { ...result, confidence: 0.9, quickActions };
};

export const isDeterministicAssistantAction = (actionName: string): actionName is ChatbotAssistantAction =>
  ROUTES.some((route) => route.action === actionName);

export const ASSISTANT_MIN_CONFIDENCE = 0.72;

const EXISTING_ACTIONS = ['track_order', 'show_reorders', 'build_bundle', 'show_passport', 'recommend_products', 'start_quiz'] as const;
const STATIC_ACTIONS = ['contact_support', 'show_delivery_info', 'show_store_hours', 'show_store_location'] as const;
const PRODUCT_ACTIONS = ['lookup_product_price', 'lookup_product_availability', 'show_brewing_guidance'] as const;

/**
 * Every backend action the chatbot UI has a handler for. An action outside this list is never acted on:
 * the message simply continues down the normal pipeline, so an unknown action cannot add a second user bubble.
 */
export const HANDLED_ASSISTANT_ACTIONS: ReadonlySet<string> = new Set<string>([...EXISTING_ACTIONS, ...STATIC_ACTIONS, ...PRODUCT_ACTIONS]);

export const isHandledAssistantAction = (actionName: string): actionName is ChatbotAssistantAction =>
  HANDLED_ASSISTANT_ACTIONS.has(actionName);

export type AssistantPlan =
  | { kind: 'passthrough' }
  | { kind: 'existing'; action: ChatbotAssistantAction }
  | { kind: 'static'; action: ChatbotAssistantAction }
  | { kind: 'product'; action: ChatbotAssistantAction; productQuery: string };

/**
 * Decides what the chatbot does with a routing result. passthrough means "not handled here": no user bubble is
 * added and the message continues to the learned-intent resolver and Gemini.
 * Product questions without a product name also pass through, because Gemini has the conversation context.
 */
export const planAssistantAction = (routed: ChatbotAssistantResult | null): AssistantPlan => {
  if (!routed || routed.intent === 'unknown' || routed.confidence < ASSISTANT_MIN_CONFIDENCE) return { kind: 'passthrough' };
  if (!isHandledAssistantAction(routed.action)) return { kind: 'passthrough' };

  const actionName = routed.action;
  if ((PRODUCT_ACTIONS as readonly string[]).includes(actionName)) {
    const productQuery = (routed.productQuery ?? '').trim();
    return productQuery ? { kind: 'product', action: actionName, productQuery } : { kind: 'passthrough' };
  }

  if ((STATIC_ACTIONS as readonly string[]).includes(actionName)) return { kind: 'static', action: actionName };
  return { kind: 'existing', action: actionName };
};
