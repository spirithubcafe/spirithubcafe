import { apiClient, publicHttp } from './apiClient';
import { productService } from './productService';
import { safeStorage } from '../lib/safeStorage';
import { getProductImageUrl, resolveProductImageUrl } from '../lib/imageUtils';
import { getActiveRegionForApi } from '../lib/regionUtils';
import { resolveCurrentLocaleForApi } from '../lib/locale';
import type { CartItem } from '../contexts/CartContextDefinition';
import type { Product as ApiProduct, ProductVariant } from '../types/product';
import type { ChatProduct } from './geminiChatService';

export type CustomerEventType =
  | 'product_view'
  | 'search'
  | 'add_to_cart'
  | 'chatbot_message'
  | 'chatbot_recommendation_click'
  | 'gift_interest'
  | 'wholesale_interest'
  | 'CHATBOT_RECOMMENDATION_SHOWN'
  | 'CHATBOT_PRODUCT_CLICK'
  | 'CHATBOT_ADD_TO_CART'
  | 'CHATBOT_PURCHASE'
  | 'CHATBOT_NO_RESULT'
  | 'CHATBOT_USER_REPHRASED';

export interface CustomerEventPayload {
  customerId?: number | null;
  eventType: CustomerEventType;
  productId?: number | null;
  categoryId?: number | null;
  searchTerm?: string | null;
  language?: string;
  country?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerCoffeeProfile {
  customerId?: number | null;
  sessionId?: string | null;
  favoriteCategories?: string[];
  favoriteNotesEn?: string[];
  favoriteNotesAr?: string[];
  favoriteOrigins?: string[];
  favoriteProcesses?: string[];
  favoriteBrewMethods?: string[];
  favoriteRoastProfiles?: string[];
  favoriteProductIds?: number[];
  lastViewedProductIds?: number[];
  lastSearchedTerms?: string[];
  topInterests?: string[];
  profileConfidenceScore?: number;
  scores?: {
    espresso?: number;
    filter?: number;
    capsules?: number;
    gift?: number;
    wholesale?: number;
  };
}

export interface CoffeeQuizOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface CoffeeQuizQuestion {
  key: string;
  textEn: string;
  textAr: string;
  options: CoffeeQuizOption[];
}

export interface CoffeeQuizSession {
  quizSessionId: number;
  questions: CoffeeQuizQuestion[];
}

export interface CoffeeQuizRecommendations {
  title: string;
  titleAr?: string;
  summary?: string;
  summaryAr?: string;
  products: ChatProduct[];
}

export interface CoffeeQuizStatus {
  hasStarted?: boolean;
  isComplete?: boolean;
  quizSessionId?: number | null;
  nextQuestion?: CoffeeQuizQuestion | null;
  progressLabelEn?: string;
  progressLabelAr?: string;
}

export interface AIBundleProduct {
  productId: number;
  productVariantId: number | null;
  slug?: string;
  nameEn: string;
  nameAr?: string | null;
  roleEn?: string;
  roleAr?: string;
  price?: string;
  priceValue?: number;
  image?: string | null;
  url?: string;
  matchScore?: number;
  matchReasonsEn?: string[];
  matchReasonsAr?: string[];
}

export interface AIBundleResponse {
  bundleId: string;
  titleEn: string;
  titleAr?: string;
  summaryEn?: string;
  summaryAr?: string;
  totalPrice?: string;
  matchScore?: number;
  products: AIBundleProduct[];
  quickActions?: string[];
  quickActionsAr?: string[];
}

export interface SmartReorderSuggestion {
  suggestionId: string;
  productId: number;
  productVariantId: number | null;
  nameEn: string;
  nameAr?: string | null;
  image?: string | null;
  url?: string;
  confidenceScore?: number;
  reasonEn?: string;
  reasonAr?: string;
}

export interface SmartReorderSuggestionsResponse {
  hasSuggestions?: boolean;
  titleEn?: string;
  titleAr?: string;
  suggestions: SmartReorderSuggestion[];
}

export interface CartReadyItem {
  productId: number;
  productVariantId: number | null;
  quantity: number;
}

export interface OpeningPersonalizationData {
  preferences: CustomerCoffeeProfile | null;
  recommendations: ChatProduct[];
  smartReorder: SmartReorderSuggestionsResponse | null;
  quizStatus: CoffeeQuizStatus | null;
}

const SESSION_ID_KEY = 'spirithub-personalization-session-id';
const PERSONALIZATION_API_ENABLED = import.meta.env.VITE_PERSONALIZATION_API_ENABLED === 'true';

const getSessionId = (): string => {
  const existing = safeStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `sh-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  safeStorage.setItem(SESSION_ID_KEY, generated);
  return generated;
};

const unwrap = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toAbsoluteImageUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (value.startsWith('http')) return value;
  return getProductImageUrl(value);
};

const normalizeProductSlug = (value: unknown): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const raw = String(value).trim();
  if (!raw) return '';

  let path = raw;
  try {
    path = new URL(raw, 'https://www.spirithubcafe.com').pathname;
  } catch {
    path = raw.split('?')[0].split('#')[0];
  }

  return path
    .replace(/^\/?(om|sa)\//i, '')
    .replace(/^\/?(shop\/product|products|product)\//i, '')
    .replace(/^\/+/, '')
    .split('?')[0]
    .split('#')[0]
    .trim();
};

const extractImageFromRecord = (item: Record<string, unknown>): string | undefined => {
  const direct = toAbsoluteImageUrl(
    item.image ??
    item.imageUrl ??
    item.imagePath ??
    item.mainImageUrl ??
    item.mainImagePath
  );
  if (direct) return direct;

  const mainImage = item.mainImage;
  if (mainImage && typeof mainImage === 'object') {
    const mainRecord = mainImage as Record<string, unknown>;
    const nested = toAbsoluteImageUrl(mainRecord.imagePath ?? mainRecord.path ?? mainRecord.url);
    if (nested) return nested;
  }

  const images = item.images;
  if (Array.isArray(images) && images.length > 0) {
    const imageRecords = images.filter((image): image is Record<string, unknown> => !!image && typeof image === 'object');
    const selected = imageRecords.find((image) => image.isMain || image.isPrimary) ?? imageRecords[0];
    return toAbsoluteImageUrl(selected?.imagePath ?? selected?.path ?? selected?.url);
  }

  return undefined;
};

const normalizeChatProduct = (raw: unknown): ChatProduct | null => {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = toNumber(item.id) ?? toNumber(item.productId);
  const name = String(item.name ?? item.nameEn ?? '').trim();
  if (!id || !name) return null;

  const priceValue =
    toNumber(item.priceValue) ??
    toNumber(item.price) ??
    toNumber(item.discountPrice) ??
    toNumber(item.minPrice) ??
    toNumber(item.basePrice);
  const matchValue = toNumber(item.matchPercentage) ?? toNumber(item.matchPercent) ?? toNumber(item.matchScore);
  const matchPercentage = matchValue === undefined
    ? undefined
    : Math.round(matchValue <= 1 ? matchValue * 100 : matchValue);

  return {
    id,
    name,
    nameAr: item.nameAr ? String(item.nameAr) : undefined,
    slug: normalizeProductSlug(item.slug) || normalizeProductSlug(item.url),
    price: priceValue ?? 0,
    productVariantId: toNumber(item.productVariantId) ?? null,
    minPrice: toNumber(item.minPrice),
    maxPrice: toNumber(item.maxPrice),
    discountPrice: toNumber(item.discountPrice),
    imageUrl: extractImageFromRecord(item),
    tastingNotes: item.tastingNotes ? String(item.tastingNotes) : item.notes ? String(item.notes) : undefined,
    tastingNotesAr: item.tastingNotesAr ? String(item.tastingNotesAr) : item.notesAr ? String(item.notesAr) : undefined,
    matchPercentage,
    rating: toNumber(item.averageRating) ?? toNumber(item.rating),
    reviewCount: toNumber(item.reviewCount),
    category: item.categoryName ? String(item.categoryName) : item.category ? String(item.category) : undefined,
  };
};

const normalizeChatProducts = (value: unknown): ChatProduct[] => {
  const raw = unwrap<unknown>(value);
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(record.products)
      ? record.products
      : Array.isArray(record.recommendations)
        ? record.recommendations
        : [];

  return list.map(normalizeChatProduct).filter((item): item is ChatProduct => !!item);
};

const hydrateChatProductImages = async (products: ChatProduct[]): Promise<ChatProduct[]> => (
  Promise.all(products.map(async (product) => {
    const hydrated = await getProductHydration(product.id);
    const minPrice = product.minPrice && product.minPrice > 0
      ? product.minPrice
      : hydrated.minPrice;
    const price = product.price > 0
      ? product.price
      : minPrice ?? 0;

    return {
      ...product,
      price,
      minPrice,
      maxPrice: product.maxPrice && product.maxPrice > 0 ? product.maxPrice : hydrated.maxPrice,
      productVariantId: product.productVariantId ?? hydrated.productVariantId ?? null,
      imageUrl: hydrated.imageUrl ?? product.imageUrl,
      slug: product.slug || hydrated.slug || '',
      nameAr: product.nameAr ?? hydrated.nameAr,
      tastingNotes: product.tastingNotes ?? hydrated.tastingNotes,
      tastingNotesAr: product.tastingNotesAr ?? hydrated.tastingNotesAr,
      category: product.category ?? hydrated.category,
    };
  }))
);

const normalizeBundle = (bundle: AIBundleResponse): AIBundleResponse => ({
  ...bundle,
  products: (bundle.products ?? []).map((product) => ({
    ...product,
    image: toAbsoluteImageUrl(product.image) ?? product.image,
  })),
});

const normalizeSmartReorder = (response: SmartReorderSuggestionsResponse): SmartReorderSuggestionsResponse => ({
  ...response,
  suggestions: (response.suggestions ?? []).map((suggestion) => ({
    ...suggestion,
    image: toAbsoluteImageUrl(suggestion.image) ?? suggestion.image,
  })),
});

const normalizeQuizStatus = (payload: unknown): CoffeeQuizStatus | null => {
  const data = unwrap<Record<string, unknown>>(payload);
  if (!data || typeof data !== 'object') return null;
  const quizSessionId = toNumber(data.quizSessionId ?? data.sessionId);

  return {
    hasStarted: Boolean(data.hasStarted ?? data.started ?? quizSessionId),
    isComplete: Boolean(data.isComplete ?? data.complete ?? data.completed),
    quizSessionId: quizSessionId ?? null,
    nextQuestion: (data.nextQuestion ?? data.currentQuestion ?? data.question ?? null) as CoffeeQuizQuestion | null,
    progressLabelEn: data.progressLabelEn ? String(data.progressLabelEn) : data.progress ? String(data.progress) : undefined,
    progressLabelAr: data.progressLabelAr ? String(data.progressLabelAr) : undefined,
  };
};

const productDetailsCache = new Map<number, Promise<ApiProduct | null>>();

const getProductDetails = (productId: number): Promise<ApiProduct | null> => {
  const existing = productDetailsCache.get(productId);
  if (existing) return existing;

  const request = productService.getByIdentifierRaw(productId)
    .then((result) => result.product)
    .catch(() => null);

  productDetailsCache.set(productId, request);
  return request;
};

const getLowestVariantPricing = (product: ApiProduct | null) => {
  const variants = (product?.variants ?? [])
    .filter((variant) => variant.isActive !== false)
    .map((variant) => ({
      ...variant,
      effectivePrice: variant.discountPrice && variant.discountPrice > 0
        ? variant.discountPrice
        : variant.price,
    }))
    .filter((variant) => variant.effectivePrice > 0)
    .sort((a, b) => a.effectivePrice - b.effectivePrice);

  if (variants.length === 0) return {};

  return {
    minPrice: variants[0].effectivePrice,
    maxPrice: variants[variants.length - 1].effectivePrice,
    productVariantId: variants[0].id,
  };
};

const getProductHydration = async (productId: number) => {
  const product = await getProductDetails(productId);
  const pricing = getLowestVariantPricing(product);

  return {
    imageUrl: product
      ? resolveProductImageUrl(product as ApiProduct & Record<string, unknown>)
      : undefined,
    slug: product?.slug,
    nameAr: product?.nameAr,
    tastingNotes: product?.tastingNotes,
    tastingNotesAr: product?.tastingNotesAr,
    category: product?.category?.name,
    ...pricing,
  };
};

const hydrateBundleImages = async (bundle: AIBundleResponse): Promise<AIBundleResponse> => {
  const normalized = normalizeBundle(bundle);
  const products = await Promise.all(
    (normalized.products ?? []).map(async (product) => {
      const hydrated = await getProductHydration(product.productId);
      return {
        ...product,
        image: hydrated.imageUrl ?? product.image,
        productVariantId: product.productVariantId ?? hydrated.productVariantId ?? null,
        priceValue: product.priceValue ?? hydrated.minPrice,
      };
    }),
  );

  return { ...normalized, products };
};

const headers = () => ({ 'X-Session-Id': getSessionId() });

const getApiBaseUrl = (): string => {
  const savedRegion = getActiveRegionForApi();

  if (savedRegion === 'sa') {
    return import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }

  return import.meta.env.VITE_API_BASE_URL_OM || import.meta.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
};

const buildQuery = (params: Record<string, unknown>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

const optionalGet = async <T>(path: string, params: Record<string, unknown>, timeoutMs = 2500): Promise<T | null> => {
  if (!PERSONALIZATION_API_ENABLED) return null;
  if (typeof window === 'undefined') return null;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = safeStorage.getItem('accessToken');
    const currentRegion = getActiveRegionForApi();
    const response = await fetch(`${getApiBaseUrl()}${path}${buildQuery(params)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': resolveCurrentLocaleForApi(),
        'X-Branch': currentRegion,
        'X-Session-Id': getSessionId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'omit',
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return unwrap<T>(await response.json());
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const eventQueue: CustomerEventPayload[] = [];
let eventFlushScheduled = false;

const flushEventQueue = () => {
  eventFlushScheduled = false;
  const next = eventQueue.shift();
  if (!next) return;

  void publicHttp.post('/api/customer-events/track', {
    ...next,
    sessionId: getSessionId(),
    source: next.source ?? 'website',
  }, { headers: headers(), timeout: 5000 }).catch(() => undefined);

  if (eventQueue.length > 0) {
    window.setTimeout(flushEventQueue, 0);
    eventFlushScheduled = true;
  }
};

export const personalizationService = {
  isEnabled: (): boolean => PERSONALIZATION_API_ENABLED,

  getSessionId,

  trackEvent: (payload: CustomerEventPayload): void => {
    if (typeof window === 'undefined') return;
    eventQueue.push(payload);
    if (eventFlushScheduled) return;

    eventFlushScheduled = true;
    const schedule = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 1));
    schedule(flushEventQueue, { timeout: 1500 });
  },

  getProfile: async (sessionId = getSessionId()): Promise<CustomerCoffeeProfile | null> => {
    try {
      const response = await apiClient.get('/api/customer-profile/me', {
        params: { sessionId },
        headers: headers(),
      });
      return unwrap<CustomerCoffeeProfile>(response.data);
    } catch {
      return null;
    }
  },

  getPreferences: async (params: { customerId?: number | null; language: string; country: string; sessionId?: string }): Promise<CustomerCoffeeProfile | null> => {
    return optionalGet<CustomerCoffeeProfile>('/api/customer-profile/preferences', {
      customerId: params.customerId ?? undefined,
      sessionId: params.sessionId ?? getSessionId(),
      language: params.language,
      country: params.country,
    });
  },

  getForYouRecommendations: async (params: { customerId?: number | null; language: string; country: string; sessionId?: string }): Promise<ChatProduct[]> => {
    const payload = await optionalGet<unknown>('/api/recommendations/for-you', {
      customerId: params.customerId ?? undefined,
      sessionId: params.sessionId ?? getSessionId(),
      language: params.language,
      country: params.country,
      count: 3,
    });
    return payload ? hydrateChatProductImages(normalizeChatProducts(payload).slice(0, 3)) : [];
  },

  getCoffeeQuizStatus: async (params: { customerId?: number | null; language: string; country: string; sessionId?: string }): Promise<CoffeeQuizStatus | null> => {
    const payload = await optionalGet<unknown>('/api/coffee-quiz/status', {
      customerId: params.customerId ?? undefined,
      sessionId: params.sessionId ?? getSessionId(),
      language: params.language,
      country: params.country,
    });
    return payload ? normalizeQuizStatus(payload) : null;
  },

  getOpeningPersonalization: async (params: { customerId?: number | null; language: string; country: string }): Promise<OpeningPersonalizationData> => {
    const sessionId = getSessionId();
    const [preferences, recommendations, smartReorder, quizStatus] = await Promise.all([
      personalizationService.getPreferences({ ...params, sessionId }),
      personalizationService.getForYouRecommendations({ ...params, sessionId }),
      personalizationService.getSmartReorderSuggestions(params),
      personalizationService.getCoffeeQuizStatus({ ...params, sessionId }),
    ]);

    return { preferences, recommendations, smartReorder, quizStatus };
  },

  startCoffeeQuiz: async (params: { customerId?: number | null; language: string; country: string }): Promise<CoffeeQuizSession> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await publicHttp.post('/api/coffee-quiz/start', {
      customerId: params.customerId ?? undefined,
      sessionId: getSessionId(),
      language: params.language,
      country: params.country,
    }, { headers: headers() });
    return unwrap<CoffeeQuizSession>(response.data);
  },

  answerCoffeeQuiz: async (quizSessionId: number, questionKey: string, answerValue: string) => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await publicHttp.post('/api/coffee-quiz/answer', {
      quizSessionId,
      questionKey,
      answerValue,
    }, { headers: headers() });
    return unwrap(response.data);
  },

  completeCoffeeQuiz: async (quizSessionId: number): Promise<CoffeeQuizRecommendations> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    await publicHttp.post('/api/coffee-quiz/complete', { quizSessionId }, { headers: headers() });
    const response = await publicHttp.get('/api/coffee-quiz/recommendations', {
      params: { quizSessionId },
      headers: headers(),
    });
    const payload = unwrap<Record<string, unknown>>(response.data);
    const products = await hydrateChatProductImages(normalizeChatProducts(payload));
    return {
      title: String(payload.title ?? 'Your perfect coffee matches'),
      titleAr: payload.titleAr ? String(payload.titleAr) : undefined,
      summary: payload.summary ? String(payload.summary) : undefined,
      summaryAr: payload.summaryAr ? String(payload.summaryAr) : undefined,
      products,
    };
  },

  createBundle: async (params: { customerId?: number | null; language: string; country: string; message: string }): Promise<AIBundleResponse> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await publicHttp.post('/api/ai-bundle-builder/create', {
      customerId: params.customerId ?? undefined,
      sessionId: getSessionId(),
      language: params.language,
      country: params.country,
      message: params.message,
    }, { headers: headers() });
    return hydrateBundleImages(unwrap<AIBundleResponse>(response.data));
  },

  refineBundle: async (bundleId: string, message: string, language: string): Promise<AIBundleResponse> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await publicHttp.post('/api/ai-bundle-builder/refine', {
      bundleId,
      message,
      language,
    }, { headers: headers() });
    return hydrateBundleImages(unwrap<AIBundleResponse>(response.data));
  },

  addBundleToCart: async (bundleId: string): Promise<CartReadyItem[]> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await publicHttp.post('/api/ai-bundle-builder/add-to-cart', {
      bundleId,
      giftWrap: false,
    }, { headers: headers() });
    const payload = unwrap<{ items?: CartReadyItem[] }>(response.data);
    return payload.items ?? [];
  },

  getSmartReorderSuggestions: async (params: { customerId?: number | null; language: string; country: string }): Promise<SmartReorderSuggestionsResponse | null> => {
    if (!params.customerId) return null;
    const payload = await optionalGet<SmartReorderSuggestionsResponse>('/api/smart-reorder/suggestions', {
      customerId: params.customerId,
      language: params.language,
      country: params.country,
    });
    return payload ? normalizeSmartReorder(payload) : null;
  },

  reorder: async (suggestionId: string, customerId?: number | null): Promise<CartReadyItem[]> => {
    if (!PERSONALIZATION_API_ENABLED) {
      throw new Error('PERSONALIZATION_API_DISABLED');
    }
    const response = await apiClient.post('/api/smart-reorder/reorder', {
      suggestionId,
      customerId: customerId ?? undefined,
    });
    const payload = unwrap<{ items?: CartReadyItem[] }>(response.data);
    return payload.items ?? [];
  },

  snoozeReorder: async (suggestionId: string, customerId?: number | null): Promise<void> => {
    if (!PERSONALIZATION_API_ENABLED) return;
    await apiClient.post('/api/smart-reorder/snooze', {
      suggestionId,
      customerId: customerId ?? undefined,
      days: 7,
    });
  },

  dismissReorder: async (suggestionId: string, customerId?: number | null): Promise<void> => {
    if (!PERSONALIZATION_API_ENABLED) return;
    await apiClient.post('/api/smart-reorder/dismiss', {
      suggestionId,
      customerId: customerId ?? undefined,
    });
  },

  buildCartItem: async (
    item: CartReadyItem,
    source?: {
      name?: string;
      image?: string | null;
      price?: number;
      tastingNotes?: string;
      variantName?: string;
    },
  ): Promise<Omit<CartItem, 'quantity'> | null> => {
    let product: ApiProduct | null = null;

    if (!source?.name || !source?.image || !source?.price) {
      try {
        const raw = await productService.getByIdentifierRaw(item.productId);
        product = raw.product;
      } catch {
        product = null;
      }
    }

    const variant = product?.variants?.find((candidate: ProductVariant) => candidate.id === item.productVariantId);
    const price = source?.price ?? variant?.discountPrice ?? variant?.price ?? 0;
    const name = source?.name ?? product?.name ?? `Product ${item.productId}`;

    if (!price || price <= 0) return null;

    const variantLabel = variant?.weight && variant.weightUnit ? `${variant.weight}${variant.weightUnit}` : undefined;
    const image = source?.image ?? getProductImageUrl(product?.mainImage?.imagePath);
    const variantId = item.productVariantId ?? null;

    return {
      id: variantId ? `${item.productId}-${variantId}` : `${item.productId}`,
      productId: item.productId,
      productVariantId: variantId,
      name: variantLabel ? `${name} - ${variantLabel}` : name,
      price,
      image,
      tastingNotes: source?.tastingNotes ?? product?.tastingNotes,
      variantName: source?.variantName ?? variantLabel,
      weight: variant?.weight,
      weightUnit: variant?.weightUnit,
      maxStock: variant?.stockQuantity,
    };
  },
};
