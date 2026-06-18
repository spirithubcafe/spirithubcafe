import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
  type FunctionDeclaration,
  type Content,
  type Part,
} from '@google/generative-ai';
import { mcpService } from './mcpService';
import { formatPrice, getCurrencyByRegion, type RegionCode } from '../lib/regionUtils';
import { REGION_INFO } from '../config/regionInfo';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL_NAME = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-2.5-flash-lite';
const GEMINI_RETRY_DELAYS_MS = [800, 1600];

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatProduct {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  discountPrice?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  products?: ChatProduct[];
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are a product guide assistant for SpiritHub specialty coffee. Help customers find the right products.

CRITICAL LANGUAGE RULE: Detect the language of EACH user message and reply ONLY in that exact language.
- If the user writes in English → reply in English only
- If the user writes in Arabic → reply in Arabic only
- Never mix languages. Never default to Arabic.

Product rules:
- Use search tools to get accurate product info
- For Arabic flavor searches, translate the product or flavor keyword to English before calling search_products
- For "best products" / "top products" / "recommendations" → call get_best_sellers (not get_featured_products)
- If get_featured_products returns an empty list, call get_best_sellers instead — never say there are no products
- Mention prices clearly using only the provided regional currency
- Never use dollars or the "$" symbol
- Be friendly and concise
- When product cards are returned, keep the text to one short intro sentence and do not duplicate the product list
- Show 3-4 products maximum`;

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'search_products',
    description: 'Search for products by name, description, or keyword. Use this to find specific products or products matching a query.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: 'Search query text' },
        pageSize: { type: SchemaType.NUMBER, description: 'Number of results (max 20, default 8)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all available product categories. Use this when user asks about categories or what types of products are available.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'list_products_by_category',
    description: 'List products in a specific category by category ID.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        categoryId: { type: SchemaType.NUMBER, description: 'The category ID to filter by' },
        pageSize: { type: SchemaType.NUMBER, description: 'Number of results (max 20, default 8)' },
      },
      required: ['categoryId'],
    },
  },
  {
    name: 'get_featured_products',
    description: 'Get featured/recommended products. Use when user asks for recommendations, best products, or popular items.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        count: { type: SchemaType.NUMBER, description: 'Number of products to return (max 10)' },
      },
    },
  },
  {
    name: 'get_best_sellers',
    description: 'Get best-selling products ranked by sales. Use when user asks for popular or top-selling items.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        count: { type: SchemaType.NUMBER, description: 'Number of products to return (max 10)' },
      },
    },
  },
  {
    name: 'get_latest_products',
    description: 'Get the newest/latest products. Use when user asks for new arrivals or recent additions.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        count: { type: SchemaType.NUMBER, description: 'Number of products to return (max 10)' },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Get full details of a specific product by its ID or slug.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'Product ID' },
        slug: { type: SchemaType.STRING, description: 'Product slug' },
      },
    },
  },
];

function extractProducts(data: unknown): ChatProduct[] {
  if (!data || typeof data !== 'object') return [];

  const toNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const tryExtract = (arr: unknown[]): ChatProduct[] =>
    arr
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
      .slice(0, 4)
      .map((p) => {
        const minPrice = toNumber(p.minPrice);
        const maxPrice = toNumber(p.maxPrice);
        const price = toNumber(p.price) ?? toNumber(p.basePrice) ?? minPrice ?? 0;

        return {
          id: Number(p.id ?? p.productId ?? 0),
          name: String(p.name ?? p.nameEn ?? ''),
          nameAr: p.nameAr ? String(p.nameAr) : undefined,
          slug: String(p.slug ?? ''),
          price,
          minPrice,
          maxPrice,
          discountPrice: toNumber(p.discountPrice),
          imageUrl: extractImageUrl(p),
          rating: toNumber(p.averageRating) ?? toNumber(p.rating),
          reviewCount: toNumber(p.reviewCount),
          category: p.categoryName ? String(p.categoryName) : p.category ? String(p.category) : undefined,
        };
      })
      .filter((p) => p.id > 0 && p.name);

  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return tryExtract(obj.items);
  if (Array.isArray(obj.products)) return tryExtract(obj.products);
  if (Array.isArray(obj.data)) return tryExtract(obj.data);
  if (Array.isArray(data)) return tryExtract(data as unknown[]);

  // Single product
  if (obj.id && obj.name) {
    return tryExtract([obj]);
  }

  return [];
}

function extractImageUrl(product: Record<string, unknown>): string | undefined {
  const base = 'https://api.spirithubcafe.com';

  const tryPath = (path: unknown): string | undefined => {
    if (!path || typeof path !== 'string') return undefined;
    if (path.startsWith('http')) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (tryPath(product.mainImageUrl)) return tryPath(product.mainImageUrl);
  if (tryPath(product.mainImagePath)) return tryPath(product.mainImagePath);
  if (tryPath(product.imageUrl)) return tryPath(product.imageUrl);
  if (tryPath(product.imagePath)) return tryPath(product.imagePath);

  const images = product.images as unknown[];
  if (Array.isArray(images) && images.length > 0) {
    const main = (images as Record<string, unknown>[]).find((img) => img.isMain) ?? images[0];
    return tryPath((main as Record<string, unknown>)?.path ?? (main as Record<string, unknown>)?.url);
  }

  return undefined;
}

const ARABIC_SEARCH_SYNONYMS: Array<[RegExp, string]> = [
  [/فراول[هة]/i, 'strawberry'],
  [/فريز/i, 'strawberry'],
  [/توت/i, 'berry'],
  [/توت\s*ازرق|توت\s*أزرق|بلوبيري/i, 'blueberry'],
  [/كرز/i, 'cherry'],
  [/خوخ/i, 'peach'],
  [/مشمش/i, 'apricot'],
  [/عنب/i, 'grape'],
  [/تفاح/i, 'apple'],
  [/برتقال/i, 'orange'],
  [/ليمون/i, 'lemon'],
  [/حمضيات/i, 'citrus'],
  [/شوكولات[هة]/i, 'chocolate'],
  [/كاكاو/i, 'cacao'],
  [/كراميل/i, 'caramel'],
  [/عسل/i, 'honey'],
  [/زهور|زهري/i, 'floral'],
  [/ياسمين/i, 'jasmine'],
  [/فواكه|فاكه[هة]/i, 'fruity'],
];

const SAFE_ARABIC_SEARCH_SYNONYMS: Array<[RegExp, string]> = [
  [/\u0641\u0631\u0627\u0648\u0644[\u0647\u0629]/i, 'strawberry'],
  [/\u0641\u0631\u064a\u0632/i, 'strawberry'],
  [/\u062a\u0648\u062a/i, 'berry'],
  [/\u062a\u0648\u062a\s*\u0627\u0632\u0631\u0642|\u062a\u0648\u062a\s*\u0623\u0632\u0631\u0642|\u0628\u0644\u0648\u0628\u064a\u0631\u064a/i, 'blueberry'],
  [/\u0643\u0631\u0632/i, 'cherry'],
  [/\u062e\u0648\u062e/i, 'peach'],
  [/\u0645\u0634\u0645\u0634/i, 'apricot'],
  [/\u0639\u0646\u0628/i, 'grape'],
  [/\u062a\u0641\u0627\u062d/i, 'apple'],
  [/\u0628\u0631\u062a\u0642\u0627\u0644/i, 'orange'],
  [/\u0644\u064a\u0645\u0648\u0646/i, 'lemon'],
  [/\u062d\u0645\u0636\u064a\u0627\u062a/i, 'citrus'],
  [/\u0634\u0648\u0643\u0648\u0644\u0627\u062a[\u0647\u0629]/i, 'chocolate'],
  [/\u0643\u0627\u0643\u0627\u0648/i, 'cacao'],
  [/\u0643\u0631\u0627\u0645\u064a\u0644/i, 'caramel'],
  [/\u0639\u0633\u0644/i, 'honey'],
  [/\u0632\u0647\u0648\u0631|\u0632\u0647\u0631\u064a/i, 'floral'],
  [/\u064a\u0627\u0633\u0645\u064a\u0646/i, 'jasmine'],
  [/\u0641\u0648\u0627\u0643\u0647|\u0641\u0627\u0643\u0647[\u0647\u0629]/i, 'fruity'],
];

function buildSearchQueries(query: string): string[] {
  const normalizedQuery = query.trim();
  const queries = new Set<string>();
  const synonymRules = SAFE_ARABIC_SEARCH_SYNONYMS.length > 0
    ? SAFE_ARABIC_SEARCH_SYNONYMS
    : ARABIC_SEARCH_SYNONYMS;

  if (normalizedQuery) queries.add(normalizedQuery);

  for (const [pattern, replacement] of synonymRules) {
    if (!pattern.test(normalizedQuery)) continue;

    queries.add(replacement);
    queries.add(normalizedQuery.replace(pattern, replacement).trim());
  }

  return Array.from(queries).filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableGeminiError(err: unknown) {
  const errorText = String(err).toLowerCase();
  return errorText.includes('503') || errorText.includes('service unavailable') || errorText.includes('overloaded');
}

async function sendWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isRetryableGeminiError(err) || attempt >= GEMINI_RETRY_DELAYS_MS.length) {
        throw err;
      }

      await wait(GEMINI_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ data: unknown; products: ChatProduct[] }> {
  let data: unknown;

  switch (name) {
    case 'search_products': {
      const pageSize = Number(args.pageSize ?? 8);
      const searchResults: unknown[] = [];

      for (const query of buildSearchQueries(String(args.query ?? ''))) {
        const result = await mcpService.searchProducts(query, { pageSize });
        searchResults.push(result);

        if (extractProducts(result).length > 0) {
          data = result;
          break;
        }
      }

      data ??= searchResults[0] ?? [];
      break;
    }
    case 'list_categories':
      data = await mcpService.listCategories();
      break;
    case 'list_products_by_category':
      data = await mcpService.listProducts({
        categoryId: Number(args.categoryId),
        pageSize: Number(args.pageSize ?? 8),
      });
      break;
    case 'get_featured_products':
      data = await mcpService.getFeaturedProducts(Number(args.count ?? 6));
      break;
    case 'get_best_sellers':
      data = await mcpService.getBestSellers(Number(args.count ?? 6));
      break;
    case 'get_latest_products':
      data = await mcpService.getLatestProducts(Number(args.count ?? 6));
      break;
    case 'get_product_details':
      data = await mcpService.getProduct({
        id: args.id ? Number(args.id) : undefined,
        slug: args.slug ? String(args.slug) : undefined,
      });
      break;
    default:
      data = null;
  }

  return { data, products: extractProducts(data) };
}

export async function getFallbackChatResponse(
  userText: string,
  language: string,
  region: RegionCode = 'om'
): Promise<{ text: string; products: ChatProduct[] } | null> {
  const query = userText.trim().toLowerCase();
  const isAr = language === 'ar';
  const contactPattern = /contact|phone|number|mobile|call|support|whatsapp|\u062a\u0648\u0627\u0635\u0644|\u0627\u062a\u0635\u0627\u0644|\u0631\u0642\u0645|\u062c\u0648\u0627\u0644|\u0647\u0627\u062a\u0641|\u0648\u0627\u062a\u0633|\u062f\u0639\u0645/i;
  const bundleBoxPattern = /bundle|box|boxes|\u0628\u0627\u0642\u0629|\u0628\u0627\u0642\u0627\u062a|\u0635\u0646\u062f\u0648\u0642|\u0635\u0646\u0627\u062f\u064a\u0642/i;
  const giftPattern = /gift|\u0647\u062f\u0627\u064a\u0627|\u0647\u062f\u064a\u0629|\u0645\u0645\u064a\u0632\u0629/i;
  const bestPattern = /best|popular|top|\u0627\u0644\u0623\u0643\u062b\u0631|\u0645\u0628\u064a\u0639/i;
  const latestPattern = /new|latest|\u062c\u062f\u064a\u062f|\u0648\u0635\u0644/i;
  const greetingPattern = /^(hi|hello|hey|thanks?|thank you|\u0645\u0631\u062d\u0628\u0627|\u0627\u0647\u0644\u0627|\u0623\u0647\u0644\u0627|\u0634\u0643\u0631\u0627)$/i;

  let products: ChatProduct[] = [];
  let attemptedProductSearch = false;

  if (contactPattern.test(query)) {
    const contact = REGION_INFO[region]?.contact ?? REGION_INFO.om.contact;
    const phones = [contact.phone, contact.phone2, contact.phone3].filter(Boolean).join(' / ');

    return {
      text: isAr
        ? `\u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0644\u0649:\n${phones}\n\n\u0648\u0627\u062a\u0633\u0627\u0628: +${contact.whatsapp}\n\u0627\u0644\u0628\u0631\u064a\u062f: ${contact.email}`
        : `You can contact us on:\n${phones}\n\nWhatsApp: +${contact.whatsapp}\nEmail: ${contact.email}`,
      products: [],
    };
  }

  if (bundleBoxPattern.test(query)) {
    products = [
      ...(await executeTool('search_products', { query: 'bundle', pageSize: 8 })).products,
      ...(await executeTool('search_products', { query: 'gift box', pageSize: 8 })).products,
      ...(await executeTool('search_products', { query: 'coffee bundle', pageSize: 8 })).products,
      ...(await executeTool('search_products', { query: 'gift', pageSize: 4 })).products,
    ];
  } else if (giftPattern.test(query)) {
    products = [
      ...(await executeTool('search_products', { query: 'gift', pageSize: 8 })).products,
      ...(await executeTool('search_products', { query: 'capsule collection', pageSize: 4 })).products,
    ];
  } else if (bestPattern.test(query)) {
    products = (await executeTool('get_best_sellers', { count: 6 })).products;
  } else if (latestPattern.test(query)) {
    products = (await executeTool('get_latest_products', { count: 6 })).products;
  } else if (query.length >= 2 && !greetingPattern.test(query)) {
    attemptedProductSearch = true;
    products = (await executeTool('search_products', { query, pageSize: 8 })).products;
  }

  if (products.length === 0 && (bundleBoxPattern.test(query) || giftPattern.test(query) || bestPattern.test(query) || latestPattern.test(query))) {
    products = (await executeTool('get_featured_products', { count: 6 })).products;
  }

  const uniqueProducts = products.filter(
    (product, index, arr) => arr.findIndex((item) => item.id === product.id) === index
  ).slice(0, 4);

  if (uniqueProducts.length === 0) {
    if (!attemptedProductSearch) return null;

    return {
      text: isAr
        ? '\u0644\u0645 \u0623\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629. \u062c\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062e\u0631\u0649 \u0645\u062b\u0644: \u0641\u0644\u062a\u0631\u060c \u0625\u0633\u0628\u0631\u064a\u0633\u0648\u060c \u0643\u0628\u0633\u0648\u0644\u0627\u062a\u060c \u0623\u0648 \u0647\u062f\u0627\u064a\u0627.'
        : 'I could not find matching products. Try another word like filter, espresso, capsules, or gifts.',
      products: [],
    };
  }

  return {
    text: isAr
      ? '\u0625\u0644\u064a\u0643 \u0628\u0639\u0636 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:'
      : 'Here are some suitable suggestions:',
    products: uniqueProducts,
  };
}

export class GeminiChatSession {
  private history: Content[] = [];
  private collectedProducts: ChatProduct[] = [];

  async sendMessage(userText: string, region: RegionCode = 'om'): Promise<{ text: string; products: ChatProduct[] }> {
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY_NOT_SET');
    }

    this.collectedProducts = [];

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations }],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });

    const chat = model.startChat({ history: this.history });

    const currency = getCurrencyByRegion(region);
    const messageWithContext = [
      `Storefront region: ${region.toUpperCase()}`,
      `Currency: ${currency}`,
      `Currency formatting examples: ${formatPrice(5.2, region, false)} and ${formatPrice(44, region, false)}`,
      'Do not use USD or the "$" symbol.',
      `Customer message: ${userText}`,
    ].join('\n');

    let response = await sendWithRetry(() => chat.sendMessage(messageWithContext));
    let candidate = response.response.candidates?.[0];

    // Agentic loop: handle function calls
    while (candidate?.content?.parts?.some((p: Part) => 'functionCall' in p)) {
      const functionParts = candidate.content.parts.filter((p: Part) => 'functionCall' in p);
      const functionResponses: Part[] = [];

      for (const part of functionParts) {
        if (!('functionCall' in part)) continue;
        const { name, args } = part.functionCall as { name: string; args: Record<string, unknown> };

        try {
          const { data, products } = await executeTool(name, args ?? {});
          this.collectedProducts.push(...products.filter(
            (p) => !this.collectedProducts.some((existing) => existing.id === p.id)
          ));
          functionResponses.push({
            functionResponse: {
              name,
              response: { result: data },
            },
          });
        } catch (err) {
          functionResponses.push({
            functionResponse: {
              name,
              response: { error: String(err) },
            },
          });
        }
      }

      response = await sendWithRetry(() => chat.sendMessage(functionResponses));
      candidate = response.response.candidates?.[0];
    }

    const text = response.response.text();

    // Update history for next turn
    this.history.push({ role: 'user', parts: [{ text: messageWithContext }] });
    this.history.push({ role: 'model', parts: [{ text }] });

    // Keep history manageable (last 20 turns = 10 exchanges)
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }

    return { text, products: this.collectedProducts.slice(0, 4) };
  }

  reset() {
    this.history = [];
    this.collectedProducts = [];
  }
}
