import type { SeoFileInfo, SeoGenerationResult, SeoOverview } from '../types/seo';
import { siteMetadata } from '../config/siteMetadata';
import { categoryService } from './categoryService';
import { productService } from './productService';
import type { Category, Product } from '../types/product';

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
    activeProductCount: productFeed.entryCount,
    activeCategoryCount: 0,
    baseUrl: window.location.origin,
  };
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
  // eslint-disable-next-line no-constant-condition
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
  return products;
};

const fetchAllCategories = async (): Promise<Category[]> => {
  return categoryService.getAll({ includeInactive: false });
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

const buildSitemapXml = (
  baseUrl: string,
  categories: Category[],
  products: Product[]
): { xml: string; entries: number } => {
  const urls: string[] = [];
  const addUrl = (path: string) => {
    urls.push(`<url><loc>${baseUrl}${path}</loc></url>`);
  };

  addUrl('/');
  addUrl('/products');
  addUrl('/about');
  addUrl('/contact');
  addUrl('/faq');
  addUrl('/privacy');
  addUrl('/terms');
  addUrl('/delivery');
  addUrl('/refund');

  categories.forEach((category) => {
    const slug = category.slug || category.id;
    addUrl(`/products?category=${slug}`);
  });

  products.forEach((product) => {
    const slugOrId = product.slug || product.id;
    addUrl(`/products/${slugOrId}`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}\n</urlset>`;
  return { xml, entries: urls.length };
};

const buildFeedXml = (baseUrl: string, products: Product[]): { xml: string; entries: number } => {
  const items = products.map((product) => {
    const slugOrId = product.slug || product.id;
    const link = `${baseUrl}/products/${slugOrId}`;
    const description = product.metaDescription || product.description || '';
    return `<item><title>${product.name}</title><link>${link}</link><guid>${link}</guid><description>${description}</description></item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Spirit Hub Cafe Product Feed</title><link>${baseUrl}</link><description>Latest active products from Spirit Hub Cafe</description>${items.join('')}\n</channel></rss>`;
  return { xml, entries: items.length };
};

export const seoService = {
  isApiEnabled: isLocalEnvironment,

  async getOverview(): Promise<SeoOverview> {
    return getPublicOverview();
  },

  async generateSitemap(): Promise<SeoGenerationResult> {
    ensureLocal();
    const [categories, products] = await Promise.all([fetchAllCategories(), fetchAllProducts()]);
    const baseUrl = siteMetadata.baseUrl;
    const { xml, entries } = buildSitemapXml(baseUrl, categories, products);
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
