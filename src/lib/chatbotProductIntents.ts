import { resolveCoffeeOrigin } from './chatbotOriginSearch.ts';

/** Keys that hold exact inventory numbers. They must never reach the user or the language model. */
const INVENTORY_KEYS = new Set(['stockquantity', 'lowstockthreshold', 'availablequantity', 'quantityinstock']);

export type AvailabilityStatus = 'in_stock' | 'out_of_stock';

export const BREWING_TEXT_MAX_LENGTH = 1200;

// ---------- Normalization ----------

/**
 * Folds text for comparison: lower-case, Latin accents and Arabic diacritics/tatweel removed,
 * hamza-alef forms to alef, alef-maqsura to yeh, teh-marbuta to heh, punctuation to single spaces.
 */
export const normalizeForMatch = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}|\u0640/gu, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const stripArticle = (token: string): string =>
  token.startsWith('ال') && token.length - 2 >= 3 ? token.slice(2) : token;

const ARABIC_PROCLITICS = ['و', 'ف', 'ب', 'ل', 'ك'];

/** All spellings a token may legitimately be compared as (article, one-letter proclitic, simple Latin plural). */
const tokenForms = (token: string): string[] => {
  const forms = new Set<string>([token, stripArticle(token)]);
  if (/^[\u0600-\u06ff]/.test(token)) {
    for (const proclitic of ARABIC_PROCLITICS) {
      if (token.length > 3 && token.startsWith(proclitic)) {
        const rest = token.slice(1);
        forms.add(rest);
        forms.add(stripArticle(rest));
      }
    }
  } else if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) {
    forms.add(token.slice(0, -1));
  }
  return [...forms];
};

export const tokenizeForMatch = (value: unknown): string[] =>
  normalizeForMatch(value).split(' ').filter(Boolean);

// ---------- Availability (never exposes inventory numbers) ----------

interface VariantLike {
  isActive?: unknown;
  stockQuantity?: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const extractVariants = (data: unknown): VariantLike[] => {
  if (Array.isArray(data)) return data.filter((v): v is VariantLike => !!asRecord(v));
  const record = asRecord(data);
  if (!record) return [];
  const direct = record.variants;
  if (Array.isArray(direct)) return direct.filter((v): v is VariantLike => !!asRecord(v));
  const nested = asRecord(record.product)?.variants;
  return Array.isArray(nested) ? nested.filter((v): v is VariantLike => !!asRecord(v)) : [];
};

const isVariantInStock = (variant: VariantLike): boolean =>
  variant.isActive !== false && Number(variant.stockQuantity ?? 0) > 0;

/** in_stock only when at least one ACTIVE variant has stock. Inactive variants never count. */
export const deriveAvailability = (variantsData: unknown): AvailabilityStatus =>
  extractVariants(variantsData).some(isVariantInStock) ? 'in_stock' : 'out_of_stock';

/**
 * Deep copy of a tool result with every exact inventory number removed. Variants (and products that
 * carry variants) get a boolean isInStock instead, so the model can still talk about availability.
 */
export const sanitizeToolResultForModel = (data: unknown): unknown => {
  if (Array.isArray(data)) return data.map(sanitizeToolResultForModel);
  const record = asRecord(data);
  if (!record) return data;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (INVENTORY_KEYS.has(key.toLowerCase())) continue;
    result[key] = sanitizeToolResultForModel(value);
  }

  if ('stockQuantity' in record) {
    result.isInStock = isVariantInStock(record as VariantLike);
  } else if (Array.isArray(record.variants)) {
    result.isInStock = deriveAvailability(record.variants);
  }

  return result;
};

// ---------- Product target resolution ----------

export interface ProductTargetCandidate {
  id: number;
  name: string;
  nameAr?: string;
  slug?: string;
}

export type ProductTarget<T extends ProductTargetCandidate> =
  | { kind: 'empty'; candidates: T[] }
  | { kind: 'confident'; product: T; candidates: T[] }
  | { kind: 'unverified'; product: T; candidates: T[] }
  | { kind: 'ambiguous'; candidates: T[] };

const MAX_AMBIGUOUS_CANDIDATES = 3;

const queryTokens = (query: string): string[] =>
  tokenizeForMatch(query).map(stripArticle).filter((token) => token.length >= 2 || /\d/.test(token));

const productTokenForms = (product: ProductTargetCandidate): Set<string> => {
  const forms = new Set<string>();
  for (const token of tokenizeForMatch(`${product.name} ${product.nameAr ?? ''} ${(product.slug ?? '').replace(/-/g, ' ')}`)) {
    tokenForms(token).forEach((form) => forms.add(form));
  }
  return forms;
};

const containsAll = (product: ProductTargetCandidate, tokens: string[]): boolean => {
  const forms = productTokenForms(product);
  return tokens.every((token) => tokenForms(token).some((form) => forms.has(form)));
};

/**
 * Packaging/format words that describe *how* a coffee is sold (drip bags, pods, samples, gift sets, ...)
 * rather than *which* coffee it is. A result whose name only adds one of these to the query is treated as an
 * alternate format of the plain coffee, not a different product.
 */
const FORMAT_VARIANT_WORDS = new Set([
  'ufo', 'drip', 'bag', 'bags', 'pod', 'pods', 'capsule', 'capsules', 'sachet', 'sachets',
  'sample', 'samples', 'trial', 'kit', 'kits', 'bundle', 'bundles', 'set', 'sets', 'box', 'boxes',
  'gift', 'pack', 'packs',
]);

const isFormatVariant = (product: ProductTargetCandidate): boolean => {
  for (const form of productTokenForms(product)) {
    if (FORMAT_VARIANT_WORDS.has(form)) return true;
  }
  return false;
};

/**
 * True only when a single clear "plain coffee" leads a fully-matching Phase 1 ranking and every other
 * fully-matching result is merely an alternate packaging/format of that same coffee (UFO drip bag, pods,
 * sample, ...). Keeps genuinely different products (e.g. a mug, or two distinct blends) ambiguous.
 */
const hasClearLeadingMatch = <T extends ProductTargetCandidate>(full: T[]): boolean => {
  const [leading, ...rest] = full;
  return !isFormatVariant(leading) && rest.every(isFormatVariant);
};

/**
 * Picks the product a price/availability/brewing question is about from Phase 1 search results.
 * confident: exactly one result names every query word, or (when `preferClearLeadingMatch` is set) several
 * do but the top-ranked Phase 1 result is clearly the plain coffee and the rest are alternate formats of it.
 * unverified: none does, so the best-ranked result is only a closest match. ambiguous: several results name
 * every query word with no sufficiently clear leading match.
 */
export const resolveProductTarget = <T extends ProductTargetCandidate>(
  products: T[],
  productQuery: string,
  options: { preferClearLeadingMatch?: boolean } = {},
): ProductTarget<T> => {
  const tokens = queryTokens(productQuery);
  if (products.length === 0 || tokens.length === 0) return { kind: 'empty', candidates: [] };

  const full = products.filter((product) => containsAll(product, tokens));
  if (full.length === 1) return { kind: 'confident', product: full[0], candidates: products };
  if (full.length > 1) {
    if (options.preferClearLeadingMatch && hasClearLeadingMatch(full)) {
      return { kind: 'confident', product: full[0], candidates: full.slice(0, MAX_AMBIGUOUS_CANDIDATES) };
    }
    return { kind: 'ambiguous', candidates: full.slice(0, MAX_AMBIGUOUS_CANDIDATES) };
  }
  return { kind: 'unverified', product: products[0], candidates: products };
};

// ---------- Brewing guidance ----------

export interface BrewingText {
  text: string;
  language: 'ar' | 'en';
  isFallbackLanguage: boolean;
}

const cleanBrewingText = (value: unknown): string => {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > BREWING_TEXT_MAX_LENGTH ? `${text.slice(0, BREWING_TEXT_MAX_LENGTH).trimEnd()}…` : text;
};

/** Catalog brewing instructions only; null when neither language has any. Nothing is generated. */
export const selectBrewingText = (productData: unknown, isAr: boolean): BrewingText | null => {
  const root = asRecord(productData);
  const product = asRecord(root?.product) ?? root;
  if (!product) return null;

  const english = cleanBrewingText(product.brewingInstructions);
  const arabic = cleanBrewingText(product.brewingInstructionsAr);
  const preferred = isAr ? arabic : english;
  const other = isAr ? english : arabic;

  if (preferred) return { text: preferred, language: isAr ? 'ar' : 'en', isFallbackLanguage: false };
  if (other) return { text: other, language: isAr ? 'en' : 'ar', isFallbackLanguage: true };
  return null;
};

// ---------- Fallback guard ----------

const NON_PRODUCT_WORDS = new Set([
  'shipping', 'ship', 'courier', 'hours', 'open', 'opening', 'close', 'closed', 'closing', 'location', 'locations', 'located',
  'address', 'directions', 'branch', 'branches', 'store', 'refund', 'return', 'returns', 'payment', 'pay', 'invoice', 'account',
  'password', 'login', 'orders', 'track', 'tracking', 'complaint', 'complain', 'support', 'contact', 'phone', 'whatsapp', 'email',
  'policy', 'job', 'jobs', 'career', 'careers',
  'توصيل', 'توصلون', 'توصل', 'شحن', 'دوام', 'ساعات', 'مفتوح', 'مغلق', 'موقع', 'موقعكم', 'عنوان', 'فرع', 'فروع', 'استرجاع',
  'استرداد', 'ارجاع', 'دفع', 'فاتوره', 'حساب', 'طلبي', 'طلبات', 'شكوي', 'دعم', 'واتساب', 'رقم', 'رقمكم', 'وظيفه', 'وظايف',
  'الغاء', 'حساسيه',
]);

const NON_PRODUCT_PREFIXES = ['deliver', 'allerg', 'cancel'];
const WHERE_WORDS = new Set(['where', 'wheres', 'وين', 'فين', 'اين']);
const PLACE_WORDS = new Set(['you', 'your', 'yours', 'shop', 'store', 'cafe', 'roastery', 'محلكم', 'مكانكم', 'فرعكم', 'كافيه', 'مقهي']);
const ORDER_CONTEXT_WORDS = new Set(['my', 'status', 'number', 'where', 'track', 'tracking', 'طلبي', 'حاله']);

const FILLER_WORDS = new Set([
  'قهوه', 'بن', 'سعر', 'اسعار', 'بكم', 'كم', 'اريد', 'ابي', 'ابغي', 'منتج', 'عن', 'ما', 'هو', 'هي', 'في', 'من', 'لو', 'سمحت', 'هل',
  'عندكم', 'متوفر', 'coffee', 'price', 'prices', 'cost', 'of', 'the', 'a', 'an', 'is', 'are', 'how', 'much', 'what', 'whats', 'for',
  'want', 'need', 'i', 'me', 'my', 'you', 'your', 'do', 'does', 'have', 'please', 'tell', 'show', 'find', 'buy', 'get', 'to', 'with',
  'can', 'any', 'some', 'there', 'it', 'this', 'that', 's',
]);

const MAX_FALLBACK_TOKENS = 8;
const MAX_FALLBACK_CONTENT_TOKENS = 4;

/** First business/policy/support word in the text (delivery, hours, location, refund, ...), or null. */
export const findNonProductWord = (text: string): string | null => {
  const tokens = tokenizeForMatch(text);
  for (const token of tokens) {
    for (const form of tokenForms(token)) {
      if (NON_PRODUCT_WORDS.has(form) || NON_PRODUCT_PREFIXES.some((prefix) => form.startsWith(prefix))) return form;
    }
  }

  if (tokens.includes('order') && tokens.some((token) => ORDER_CONTEXT_WORDS.has(token))) return 'order';

  // "Where is your shop?" / "وين محلكم": a where-question about the business, not about a product.
  const forms = tokens.flatMap(tokenForms);
  if (forms.some((form) => WHERE_WORDS.has(form)) && forms.some((form) => PLACE_WORDS.has(form))) return 'where';
  return null;
};

export type ProductLikenessReason = 'ok' | 'no_content' | 'non_product_word' | 'too_long' | 'too_many_content';

/**
 * Conservative guard before a raw message is sent to product search. It is a blocklist with length limits,
 * not an allowlist: short free-text product searches ("moon flower") are still allowed.
 * Business/policy words always block; a recognized coffee origin only relaxes the length limits.
 */
export const isProductLikeQuery = (text: string): { allowed: boolean; reason: ProductLikenessReason } => {
  const tokens = tokenizeForMatch(text);
  if (tokens.length === 0) return { allowed: false, reason: 'no_content' };
  if (findNonProductWord(text)) return { allowed: false, reason: 'non_product_word' };

  const knownOrigin = resolveCoffeeOrigin(text) !== null;
  const content = tokens.filter((token) => !tokenForms(token).some((form) => FILLER_WORDS.has(form)));
  if (content.length === 0) return { allowed: false, reason: 'no_content' };
  if (!knownOrigin && tokens.length > MAX_FALLBACK_TOKENS) return { allowed: false, reason: 'too_long' };
  if (!knownOrigin && content.length > MAX_FALLBACK_CONTENT_TOKENS) return { allowed: false, reason: 'too_many_content' };
  return { allowed: true, reason: 'ok' };
};
