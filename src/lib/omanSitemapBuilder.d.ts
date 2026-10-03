import type { SitemapCategoryLike, SitemapProductLike } from './sitemapRouteClassifier.js';

export function buildOmanSitemapXml(
  baseUrl: string,
  shopCategories: SitemapCategoryLike[],
  products: SitemapProductLike[],
): { xml: string; entries: number };
