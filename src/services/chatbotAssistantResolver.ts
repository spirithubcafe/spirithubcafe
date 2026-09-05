import type { ChatbotAssistantAction, ChatbotAssistantQuickAction, ChatbotAssistantResult } from './chatbotAssistantService';

type LocalRoute = Omit<ChatbotAssistantResult, 'confidence' | 'quickActions'> & {
  terms: RegExp;
  quickActions?: ChatbotAssistantQuickAction[];
};

const action = (id: string, labelEn: string, labelAr: string): ChatbotAssistantQuickAction => ({ id, labelEn, labelAr });

const ROUTES: LocalRoute[] = [
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
    intent: 'product_discovery', action: 'recommend_products', endpoint: '/api/recommendations/for-you', httpMethod: 'GET', requiresAuthentication: false,
    replyEn: 'I’ll help you find coffee that matches your taste and brew method.', replyAr: 'سأساعدك في إيجاد قهوة تناسب ذوقك وطريقة تحضيرك.',
    terms: /recommend.*coffee|find.*coffee|fruity coffee|espresso coffee|filter coffee|v60 coffee|coffee recommendation|رشح.*قهوة|اختر.*قهوة|قهوة فاكهية|قهوة.*فلتر|قهوة.*اسبريسو/i,
    quickActions: [action('start_quiz', 'Take the coffee quiz', 'ابدأ اختبار القهوة'), action('view_recommendations', 'Show recommendations', 'اعرض الترشيحات')],
  },
];

export const resolveChatbotAssistantLocally = (message: string): ChatbotAssistantResult | null => {
  const normalized = message.trim().replace(/\s+/g, ' ');
  const route = ROUTES.find((candidate) => candidate.terms.test(normalized));
  if (!route) return null;
  const { terms: _terms, quickActions = [], ...result } = route;
  void _terms;
  return { ...result, confidence: 0.9, quickActions };
};

export const isDeterministicAssistantAction = (actionName: string): actionName is ChatbotAssistantAction =>
  ROUTES.some((route) => route.action === actionName);
