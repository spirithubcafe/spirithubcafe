const MCP_ENDPOINT = 'https://api.spirithubcafe.com/mcp';

let requestId = 1;

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const mcpService = {
  listCategories: (params?: { includeInactive?: boolean; excludeShop?: boolean }) =>
    callTool('spirithub.list_categories', params ?? {}),

  getCategory: (params: { id?: number; slug?: string }) =>
    callTool('spirithub.get_category', params),

  listProducts: (params?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    searchTerm?: string;
    isFeatured?: boolean;
    includeInactive?: boolean;
    excludeShop?: boolean;
  }) => callTool('spirithub.list_products', params ?? {}),

  searchProducts: (query: string, params?: { page?: number; pageSize?: number; excludeShop?: boolean }) =>
    callTool('spirithub.search_products', { query, ...params }),

  getProduct: (params: { id?: number; sku?: string; slug?: string }) =>
    callTool('spirithub.get_product', params),

  getFeaturedProducts: (count = 6) =>
    callTool('spirithub.get_featured_products', { count }),

  getLatestProducts: (count = 6) =>
    callTool('spirithub.get_latest_products', { count }),

  getBestSellers: (count = 6) =>
    callTool('spirithub.get_best_sellers', { count }),

  getProductVariants: (productId: number) =>
    callTool('spirithub.get_product_variants', { productId }),

  getProductImages: (productId: number) =>
    callTool('spirithub.get_product_images', { productId }),

  getRelatedProducts: (productId: number, count = 4) =>
    callTool('spirithub.get_related_products', { productId, count }),
};
