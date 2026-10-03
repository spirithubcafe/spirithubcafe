import { createShopCategoryLookup, getOmanSitemapCategoryPath, getOmanSitemapProductPath } from './sitemapRouteClassifier.js';

const today = () => new Date().toISOString().split('T')[0];

export const buildOmanSitemapXml = (baseUrl, shopCategories, products) => {
  const urls = [];
  const regionBase = '/om';
  const shopCategoryLookup = createShopCategoryLookup(shopCategories);
  const lastmodToday = today();

  const addUrl = (path, priority, changefreq, lastmod = lastmodToday) => {
    urls.push(
      `  <url>\n` +
      `    <loc>${baseUrl}${path}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority}</priority>\n` +
      `  </url>`
    );
  };

  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Homepage - Highest Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl(regionBase, '1.0', 'daily');

  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Main Pages - High Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl(`${regionBase}/products`, '0.9', 'daily');
  addUrl(`${regionBase}/shop`, '0.8', 'daily');
  addUrl(`${regionBase}/about`, '0.7', 'monthly');
  addUrl(`${regionBase}/contact`, '0.6', 'monthly');
  addUrl(`${regionBase}/faq`, '0.5', 'monthly');
  addUrl(`${regionBase}/loyalty`, '0.5', 'monthly');

  urls.push(`\n  <!-- ====================================== -->`);
  urls.push(`  <!-- Policy Pages - Medium Priority -->`);
  urls.push(`  <!-- ====================================== -->`);
  addUrl(`${regionBase}/privacy`, '0.3', 'yearly');
  addUrl(`${regionBase}/terms`, '0.3', 'yearly');
  addUrl(`${regionBase}/delivery`, '0.4', 'monthly');
  addUrl(`${regionBase}/refund`, '0.4', 'monthly');

  if (shopCategories.length > 0) {
    urls.push(`\n  <!-- ====================================== -->`);
    urls.push(`  <!-- Product Categories - High Priority -->`);
    urls.push(`  <!-- ====================================== -->`);
    shopCategories.forEach((category) => {
      const path = getOmanSitemapCategoryPath(category, shopCategoryLookup);
      if (path) addUrl(path, '0.8', 'weekly');
    });
  }

  const productsByOrigin = {
    'UFO Drip Coffee': [],
    'Colombian Coffee': [],
    'Ethiopian Coffee': [],
    'Coffee Capsules': [],
    'Other Products': [],
  };

  products.forEach((product) => {
    const name = String(product?.name || '').toLowerCase();
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

  Object.entries(productsByOrigin).forEach(([category, categoryProducts]) => {
    if (categoryProducts.length === 0) {
      return;
    }

    urls.push(`\n  <!-- ====================================== -->`);
    urls.push(`  <!-- ${category} -->`);
    urls.push(`  <!-- ====================================== -->`);
    categoryProducts.forEach((product) => {
      const path = getOmanSitemapProductPath(product, shopCategoryLookup);
      if (!path) return;

      let lastmod = lastmodToday;
      const updatedAt = product.updatedAt || product.modifiedDate || product.createdAt;
      if (updatedAt) {
        try {
          lastmod = new Date(updatedAt).toISOString().split('T')[0];
        } catch {
          lastmod = lastmodToday;
        }
      }

      addUrl(path, '0.7', 'weekly', lastmod);
    });
  });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n` +
    `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n` +
    urls.join('\n') +
    `\n\n</urlset>`;

  return { xml, entries: urls.filter((entry) => entry.includes('<url>')).length };
};
