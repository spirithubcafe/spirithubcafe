import { getActiveRegionForApi, isRegionCode, type RegionCode } from '../lib/regionUtils.ts';

const MCP_ENDPOINT = 'https://api.spirithubcafe.com/mcp';

export interface McpCallOptions {
  /** Storefront region/branch for this call. Defaults to the active region. Never derived from message text. */
  region?: RegionCode;
}

export interface McpClientDependencies {
  fetchImpl?: typeof fetch;
  getRegion?: () => RegionCode;
  endpoint?: string;
}

/** The branch sent as X-Branch: the explicit region when valid, otherwise the active region, otherwise om. */
export const resolveMcpBranch = (region?: unknown, getRegion: () => RegionCode = getActiveRegionForApi): RegionCode => {
  if (isRegionCode(region)) return region;
  const active = getRegion();
  return isRegionCode(active) ? active : 'om';
};

export const createMcpClient = (dependencies: McpClientDependencies = {}) => {
  const endpoint = dependencies.endpoint ?? MCP_ENDPOINT;
  const getRegion = dependencies.getRegion ?? getActiveRegionForApi;
  let requestId = 1;

  async function callTool(name: string, args: Record<string, unknown> = {}, options?: McpCallOptions): Promise<unknown> {
    const fetchImpl = dependencies.fetchImpl ?? fetch;
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Branch': resolveMcpBranch(options?.region, getRegion),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId++,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });

    if (!res.ok) throw new Error(`MCP request failed: ${res.status}`);

    const data = await res.json();

    if (data.error) throw new Error(data.error.message ?? 'MCP error');

    const content = data.result?.content;
    if (Array.isArray(content) && content[0]?.type === 'text') {
      try {
        return JSON.parse(content[0].text);
      } catch {
        return content[0].text;
      }
    }

    return data.result;
  }

  return {
    callTool,

    listCategories: (params?: { includeInactive?: boolean; excludeShop?: boolean }, options?: McpCallOptions) =>
      callTool('spirithub.list_categories', params ?? {}, options),

    getCategory: (params: { id?: number; slug?: string }, options?: McpCallOptions) =>
      callTool('spirithub.get_category', params, options),

    listProducts: (params?: {
      page?: number;
      pageSize?: number;
      categoryId?: number;
      searchTerm?: string;
      isFeatured?: boolean;
      includeInactive?: boolean;
      excludeShop?: boolean;
    }, options?: McpCallOptions) => callTool('spirithub.list_products', params ?? {}, options),

    searchProducts: (query: string, params?: { page?: number; pageSize?: number; excludeShop?: boolean }, options?: McpCallOptions) =>
      callTool('spirithub.search_products', { query, ...params }, options),

    getProduct: (params: { id?: number; sku?: string; slug?: string }, options?: McpCallOptions) =>
      callTool('spirithub.get_product', params, options),

    getFeaturedProducts: (count = 6, options?: McpCallOptions) =>
      callTool('spirithub.get_featured_products', { count }, options),

    getLatestProducts: (count = 6, options?: McpCallOptions) =>
      callTool('spirithub.get_latest_products', { count }, options),

    getBestSellers: (count = 6, options?: McpCallOptions) =>
      callTool('spirithub.get_best_sellers', { count }, options),

    getProductVariants: (productId: number, options?: McpCallOptions) =>
      callTool('spirithub.get_product_variants', { productId }, options),

    getProductImages: (productId: number, options?: McpCallOptions) =>
      callTool('spirithub.get_product_images', { productId }, options),

    getRelatedProducts: (productId: number, count = 4, options?: McpCallOptions) =>
      callTool('spirithub.get_related_products', { productId, count }, options),
  };
};

export const mcpService = createMcpClient();
