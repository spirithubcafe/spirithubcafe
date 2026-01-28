import type { SeoFileInfo, SeoGenerationResult, SeoOverview } from '../types/seo';
import { siteMetadata } from '../config/siteMetadata';
import { categoryService } from './categoryService';
import { productService, productVariantService } from './productService';
import type { Category, Product } from '../types/product';
import { getProductImageUrl, resolveProductImagePath } from '../lib/imageUtils';

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
  const today = new Date().toISOString().split('T')[0];
  const urls: string[] = [];
  
  // Helper to create formatted URL entry
  const addUrl = (
    path: string, 
    priority: string, 
    changefreq: string, 
    lastmod: string = today
  ) => {
    urls.push(
      `  <url>\n` +
      `    <loc>${baseUrl}${path}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority}</priority>\n` +
      `  </url>`
    );
  };

  // Homepage - Highest Priority
  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Homepage - Highest Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl('/', '1.0', 'daily');

  // Main Pages - High Priority
  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Main Pages - High Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl('/products', '0.9', 'daily');
  addUrl('/about', '0.7', 'monthly');
  addUrl('/contact', '0.6', 'monthly');
  addUrl('/faq', '0.5', 'monthly');

  // Policy Pages - Medium Priority
  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Policy Pages - Medium Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl('/privacy', '0.3', 'yearly');
  addUrl('/terms', '0.3', 'yearly');
  addUrl('/delivery', '0.4', 'monthly');
  addUrl('/refund', '0.4', 'monthly');

  // Product Categories - High Priority
  if (categories.length > 0) {
    urls.push(`\n  <!-- ====================================== -->`);
    urls.push(`  <!-- Product Categories - High Priority -->`);
    urls.push(`  <!-- ====================================== -->`);
    categories.forEach((category) => {
      const slug = category.slug || category.id;
      addUrl(`/products?category=${slug}`, '0.8', 'weekly');
    });
  }

  // Group products by origin/type for better organization
  const productsByOrigin: { [key: string]: Product[] } = {
    'UFO Drip Coffee': [],
    'Colombian Coffee': [],
    'Ethiopian Coffee': [],
    'Coffee Capsules': [],
    'Other Products': []
  };

  products.forEach((product) => {
    const name = product.name.toLowerCase();
    if (name.includes('ufo') || name.includes('drip')) {
      productsByOrigin['UFO Drip Coffee'].push(product);
    } else if (name.includes('colombia')) {
      productsByOrigin['Colombian Coffee'].push(product);
    } else if (name.includes('ethiopia')) {
      productsByOrigin['Ethiopian Coffee'].push(product);
    } else if (name.includes('capsule')) {
      productsByOrigin['Coffee Capsules'].push(product);
    } else {
      productsByOrigin['Other Products'].push(product);
    }
  });

  // Add products by category
  Object.entries(productsByOrigin).forEach(([category, categoryProducts]) => {
    if (categoryProducts.length > 0) {
      urls.push(`\n  <!-- ====================================== -->`);
      urls.push(`  <!-- ${category} -->`);
      urls.push(`  <!-- ====================================== -->`);
      categoryProducts.forEach((product) => {
        const slugOrId = product.slug || product.id;
        addUrl(`/products/${slugOrId}`, '0.7', 'weekly');
      });
    }
  });

  // Build final XML with proper formatting
  const xml = 
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n` +
    `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n` +
    urls.join('\n') +
    `\n\n</urlset>`;
    
  return { xml, entries: urls.filter(u => u.includes('<url>')).length };
};

const buildFeedXml = (baseUrl: string, products: Product[]): { xml: string; entries: number } => {
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
    const imagePath = resolveProductImagePath(product);
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
      <g:id>${productId}</g:id>
      <g:title>${product.name}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      ${imageUrl ? `<g:image_link>${imageUrl}</g:image_link>` : ''}
      <g:price>0.000 OMR</g:price>
      <g:availability>out of stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${brand}</g:brand>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:mpn>${mpn}</g:mpn>
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
      <g:id>${variantId}</g:id>
      <g:title>${variantTitle}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      ${imageUrl ? `<g:image_link>${imageUrl}</g:image_link>` : ''}
      <g:price>${formattedPrice}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${brand}</g:brand>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:mpn>${mpn}</g:mpn>
      <g:item_group_id>${baseProductId}</g:item_group_id>
    </item>`);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Spirit Hub Cafe Product Feed</title>
    <link>${baseUrl}</link>
    <description>Latest active products from Spirit Hub Cafe</description>
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
