import type { SeoFileInfo, SeoGenerationResult, SeoOverview } from '../types/seo';
import { siteMetadata } from '../config/siteMetadata';
import { categoryService } from './categoryService';
import { productService, productVariantService } from './productService';
import type { Product } from '../types/product';
import { getProductImageUrl, resolveProductImagePath } from '../lib/imageUtils';
import { buildOmanSitemapXml } from '../lib/omanSitemapBuilder.js';

const isLocalEnvironment = (() => {
  if (typeof window !== 'undefined' && window.location) {
    return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  }
  return Boolean(import.meta.env?.DEV);
})();

const EMPTY_OVERVIEW: SeoOverview = {
  sitemap: {
    fileName: 'sitemap.xml',
    publicUrl: '/sitemap.xml',
    lastUpdatedUtc: undefined,
    sizeInBytes: 0,
    entryCount: 0,
    exists: false,
  },
  productFeed: {
    fileName: 'products-feed.xml',
    publicUrl: '/products-feed.xml',
    lastUpdatedUtc: undefined,
    sizeInBytes: 0,
    entryCount: 0,
    exists: false,
  },
  activeProductCount: 0,
  activeCategoryCount: 0,
  baseUrl:
    (typeof window !== 'undefined' ? window.location.origin : siteOriginFallback()) ?? '',
};

function siteOriginFallback(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return siteMetadata.baseUrl;
}

const PUBLIC_FILES: { file: string; nodeName: string }[] = [
  { file: 'sitemap.xml', nodeName: 'url' },
  { file: 'products-feed.xml', nodeName: 'item' },
];

const fetchPublicFileInfo = async (
  fileName: string,
  nodeName: string
): Promise<SeoFileInfo> => {
  if (typeof window === 'undefined') {
    return {
      fileName,
      publicUrl: `/${fileName}`,
      sizeInBytes: 0,
      entryCount: 0,
      exists: false,
    };
  }

  try {
    const response = await fetch(`/${fileName}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      return {
        fileName,
        publicUrl: response.url,
        sizeInBytes: 0,
        entryCount: 0,
        exists: false,
      };
    }

    const text = await response.text();
    const lastModified = response.headers.get('last-modified');
    const entryCount = (text.match(new RegExp(`<${nodeName}(\\s|>)`, 'gi')) || []).length;

    return {
      fileName,
      publicUrl: response.url,
      sizeInBytes: text.length,
      entryCount,
      exists: true,
      lastUpdatedUtc: lastModified ? new Date(lastModified).toISOString() : undefined,
    };
  } catch (error) {
    console.warn('Unable to load public SEO file', fileName, error);
    return {
      fileName,
      publicUrl: `/${fileName}`,
      sizeInBytes: 0,
      entryCount: 0,
      exists: false,
    };
  }
};

const getPublicOverview = async (): Promise<SeoOverview> => {
  if (typeof window === 'undefined') {
    return EMPTY_OVERVIEW;
  }

  const [sitemap, productFeed] = await Promise.all(
    PUBLIC_FILES.map(({ file, nodeName }) => fetchPublicFileInfo(file, nodeName))
  );

  return {
    ...EMPTY_OVERVIEW,
    sitemap,
    productFeed,
    baseUrl: window.location.origin,
  };
};

const fetchActiveCounts = async (): Promise<{ productCount: number; categoryCount: number }> => {
  try {
    const [productResponse, categories] = await Promise.all([
      productService.getAll({ page: 1, pageSize: 500, includeInactive: false }),
      categoryService.getAll({ includeInactive: false }),
    ]);

    const productCount = Array.isArray(productResponse)
      ? productResponse.length
      : productResponse.totalCount ?? productResponse.items?.length ?? 0;

    return {
      productCount,
      categoryCount: categories.length,
    };
  } catch (error) {
    console.warn('Unable to fetch active counts for SEO overview', error);
    return { productCount: 0, categoryCount: 0 };
  }
};

const downloadFile = (fileName: string, contents: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([contents], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const fetchAllProducts = async (): Promise<Product[]> => {
  const pageSize = 100;
  let page = 1;
  const products: Product[] = [];
  while (true) {
    const response = await productService.getAll({
      page,
      pageSize,
      includeInactive: false,
    });
    const items = Array.isArray(response) ? (response as Product[]) : (response.items || []);
    products.push(...items);
    if (!Array.isArray(response) && response.totalPages && page < response.totalPages) {
      page += 1;
    } else {
      break;
    }
  }
  if (products.length === 0) {
    return products;
  }

  const productsWithVariants = await Promise.all(
    products.map(async (product) => {
      try {
        const variants = await productVariantService.getByProduct(product.id);
        return { ...product, variants };
      } catch (error) {
        console.warn('Unable to fetch product variants for feed', product.id, error);
        return product;
      }
    })
  );

  return productsWithVariants;
};

const SITEMAP_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL_OM ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  siteOriginFallback()
).replace(/\/+$/, '');

const fetchSitemapJson = async <T,>(resource: string): Promise<T> => {
  const response = await fetch(`${SITEMAP_API_BASE_URL}/api/${resource}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'X-Branch': 'om',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${resource}: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const parseShopCategories = (payload: unknown): Array<{ id: number; slug: string }> => {
  if (payload && typeof payload === 'object') {
    const data = payload as { data?: { categories?: Array<{ id: number; slug: string }> }; categories?: Array<{ id: number; slug: string }> };
    if (Array.isArray(data.data?.categories)) return data.data.categories;
    if (Array.isArray(data.categories)) return data.categories;
  }
  return [];
};

const fetchAllSitemapProducts = async (): Promise<Product[]> => {
  const pageSize = 100;
  let page = 1;
  const products: Product[] = [];

  while (true) {
    const response = await fetchSitemapJson<{
      success?: boolean;
      data?: Product[];
      pagination?: { totalPages?: number };
    }>(`Products?page=${page}&pageSize=${pageSize}&includeInactive=false`);
    const items = Array.isArray(response.data) ? response.data : [];
    products.push(...items);
    const totalPages = Number(response.pagination?.totalPages || 1);
    if (page >= totalPages) break;
    page += 1;
  }

  return products;
};

const fetchAllShopCategories = async (): Promise<Array<{ id: number; slug: string }>> => {
  return parseShopCategories(await fetchSitemapJson('shop'));
};

const ensureLocal = () => {
  if (!isLocalEnvironment) {
    throw new Error('SEO generation is available only on localhost.');
  }
};

const saveFileToPublic = async (fileName: string, contents: string): Promise<boolean> => {
  if (typeof fetch === 'undefined' || !isLocalEnvironment) {
    return false;
  }

  try {
    const response = await fetch('/__seo/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contents }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Unable to save file to public directory', error);
    return false;
  }
};

const buildFeedXml = (baseUrl: string, products: Product[]): { xml: string; entries: number } => {
  const escapeXml = (value: string | number | null | undefined): string => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const items: string[] = [];
  
  products.forEach((product) => {
    const slugOrId = product.slug || product.id;
    const link = `${baseUrl}/products/${slugOrId}`;
    
    // Generate short, stable base ID (max 50 chars)
    const guidStr = String(slugOrId);
    const baseProductId = guidStr.length > 50 ? guidStr.substring(0, 50) : guidStr;
    
    // Get description
    const description = product.metaDescription || product.description || product.name || '';
    
    // Get main image URL (use API base + fallbacks for various product image fields)
    const imagePath = resolveProductImagePath(product as Product & Record<string, unknown>);
    const imageUrl = imagePath ? getProductImageUrl(imagePath) : '';
    
    // Brand
    const brand = 'Spirit Hub Cafe';
    
    // Google product category for Coffee
    const googleCategory = '499972';
    
    // Get active variants, sorted by price (low to high)
    const activeVariants = (product.variants || [])
      .filter(v => v.isActive)
      .sort((a, b) => {
        const priceA = a.discountPrice || a.price || 0;
        const priceB = b.discountPrice || b.price || 0;
        return priceA - priceB;
      });
    
    // If no variants, create one default item
    if (activeVariants.length === 0) {
      const productId = baseProductId;
      const mpn = product.sku || productId;
      
      items.push(`<item>
      <g:id>${escapeXml(productId)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      ${imageUrl ? `<g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ''}
      <g:price>0.000 OMR</g:price>
      <g:availability>out of stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
    </item>`);
      return;
    }
    
    // Create separate item for each variant
    activeVariants.forEach((variant) => {
      const price = variant.discountPrice || variant.price || 0;
      const stockQuantity = variant.stockQuantity || 0;
      const availability = stockQuantity > 0 ? 'in stock' : 'out of stock';
      const formattedPrice = `${price.toFixed(3)} OMR`;
      
      // Create variant-specific ID: base-id + weight + unit (e.g., "yemen-odaini-250g")
      const weightStr = `${variant.weight}${variant.weightUnit}`.toLowerCase();
      let variantId = `${baseProductId}-${weightStr}`;
      
      // Ensure variant ID is under 50 chars
      if (variantId.length > 50) {
        // Try shorter base ID
        const shorterBase = baseProductId.substring(0, 50 - weightStr.length - 1);
        variantId = `${shorterBase}-${weightStr}`;
      }
      
      // Create variant title with weight
      const variantTitle = `${product.name} – ${variant.weight}${variant.weightUnit}`;
      
      // MPN uses variant SKU
      const mpn = variant.variantSku || product.sku || variantId;
      
      // Build item with item_group_id for grouping
      items.push(`<item>
      <g:id>${escapeXml(variantId)}</g:id>
      <g:title>${escapeXml(variantTitle)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      ${imageUrl ? `<g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ''}
      <g:price>${escapeXml(formattedPrice)}</g:price>
      <g:availability>${escapeXml(availability)}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:item_group_id>${escapeXml(baseProductId)}</g:item_group_id>
    </item>`);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml('Spirit Hub Cafe Product Feed')}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml('Latest active products from Spirit Hub Cafe')}</description>
${items.join('\n')}
  </channel>
</rss>`;
  return { xml, entries: items.length };
};

export const seoService = {
  isApiEnabled: isLocalEnvironment,

  async getOverview(): Promise<SeoOverview> {
    const [overview, counts] = await Promise.all([getPublicOverview(), fetchActiveCounts()]);
    return {
      ...overview,
      activeProductCount: counts.productCount,
      activeCategoryCount: counts.categoryCount,
    };
  },

  async generateSitemap(): Promise<SeoGenerationResult> {
    ensureLocal();
    const [shopCategories, products] = await Promise.all([fetchAllShopCategories(), fetchAllSitemapProducts()]);
    const baseUrl = siteMetadata.baseUrl;
    const { xml, entries } = buildOmanSitemapXml(baseUrl, shopCategories, products);
    const saved = await saveFileToPublic('sitemap.xml', xml);
    if (!saved) {
      downloadFile('sitemap.xml', xml);
    }
    return {
      fileName: 'sitemap.xml',
      publicUrl: `${baseUrl}/sitemap.xml`,
      lastUpdatedUtc: new Date().toISOString(),
      sizeInBytes: xml.length,
      entryCount: entries,
      exists: true,
      message: saved
        ? 'Sitemap saved to /public/sitemap.xml.'
        : 'Sitemap generated locally. File downloaded for manual upload.',
    };
  },

  async generateFeed(): Promise<SeoGenerationResult> {
    ensureLocal();
    const products = await fetchAllProducts();
    const baseUrl = siteMetadata.baseUrl;
    const { xml, entries } = buildFeedXml(baseUrl, products);
    const saved = await saveFileToPublic('products-feed.xml', xml);
    if (!saved) {
      downloadFile('products-feed.xml', xml);
    }
    return {
      fileName: 'products-feed.xml',
      publicUrl: `${baseUrl}/products-feed.xml`,
      lastUpdatedUtc: new Date().toISOString(),
      sizeInBytes: xml.length,
      entryCount: entries,
      exists: true,
      message: saved
        ? 'Product feed saved to /public/products-feed.xml.'
        : 'Feed generated locally. File downloaded for manual upload.',
    };
  },
};
