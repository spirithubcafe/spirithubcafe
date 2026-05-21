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

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatProduct {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
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
- For "best products" / "top products" / "recommendations" → call get_best_sellers (not get_featured_products)
- If get_featured_products returns an empty list, call get_best_sellers instead — never say there are no products
- Mention prices clearly
- Be friendly and concise
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

  const tryExtract = (arr: unknown[]): ChatProduct[] =>
    arr
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
      .slice(0, 4)
      .map((p) => ({
        id: Number(p.id ?? p.productId ?? 0),
        name: String(p.name ?? p.nameEn ?? ''),
        nameAr: p.nameAr ? String(p.nameAr) : undefined,
        slug: String(p.slug ?? ''),
        price: Number(p.price ?? p.basePrice ?? 0),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
        imageUrl: extractImageUrl(p),
        rating: p.averageRating ? Number(p.averageRating) : p.rating ? Number(p.rating) : undefined,
        reviewCount: p.reviewCount ? Number(p.reviewCount) : undefined,
        category: p.categoryName ? String(p.categoryName) : p.category ? String(p.category) : undefined,
      }))
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
  if (tryPath(product.imageUrl)) return tryPath(product.imageUrl);
  if (tryPath(product.imagePath)) return tryPath(product.imagePath);

  const images = product.images as unknown[];
  if (Array.isArray(images) && images.length > 0) {
    const main = (images as Record<string, unknown>[]).find((img) => img.isMain) ?? images[0];
    return tryPath((main as Record<string, unknown>)?.path ?? (main as Record<string, unknown>)?.url);
  }

  return undefined;
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ data: unknown; products: ChatProduct[] }> {
  let data: unknown;

  switch (name) {
    case 'search_products':
      data = await mcpService.searchProducts(String(args.query ?? ''), {
        pageSize: Number(args.pageSize ?? 8),
      });
      break;
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

export class GeminiChatSession {
  private history: Content[] = [];
  private collectedProducts: ChatProduct[] = [];

  async sendMessage(userText: string): Promise<{ text: string; products: ChatProduct[] }> {
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY_NOT_SET');
    }

    this.collectedProducts = [];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
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

    let response = await chat.sendMessage(userText);
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

      response = await chat.sendMessage(functionResponses);
      candidate = response.response.candidates?.[0];
    }

    const text = response.response.text();

    // Update history for next turn
    this.history.push({ role: 'user', parts: [{ text: userText }] });
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
