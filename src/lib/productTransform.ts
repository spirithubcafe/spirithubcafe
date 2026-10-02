import type { Product } from '../contexts/AppContextDefinition';
import type { Product as ApiProduct } from '../types/product';
import { getProductImageUrl, resolveProductImagePath } from './imageUtils.ts';
import { normalizeProductTags } from './productTagUtils.ts';
import type { ShopSsrBootstrap } from '../types/shop';

/** Region code as used across the storefront (om/sa). */
export type SsrBootstrapRegion = 'om' | 'sa';

/** Raw payload shape serialized by the server for the SSR products bootstrap. */
export interface ProductsSsrBootstrap {
  region: string | null;
  products: unknown[] | null;
  categories?: unknown[] | null;
  shop?: ShopSsrBootstrap | null;
}

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

/**
 * Transform raw API product list items into the app's `Product` shape.
 *
 * This is the exact mapping previously inlined in `AppContext.fetchProducts()` -
 * both the client-side fetch success path and the SSR bootstrap initializer
 * must use this same function so hydration never mismatches and so the two
 * code paths can never silently drift apart.
 */
export const transformApiProductsToProducts = (rawProducts: ApiProduct[] | null | undefined): Product[] => {
  if (!Array.isArray(rawProducts)) return [];

  const activeProducts = rawProducts.filter(
    (prod) => (prod as unknown as { isActive?: boolean }).isActive !== false,
  );

  // IMPORTANT: Avoid N+1 calls (getById per product). Use list payload for initial rendering.
  type ApiProductExtended = ApiProduct & Record<string, unknown>;
  type ProductPricing = { minPrice?: number; maxPrice?: number; price?: number };

  return activeProducts
    .map<Product | null>((prod) => {
      const p = prod as ApiProductExtended;
      const pricing = p as ProductPricing;

      // Use minPrice from list API directly - no need to fetch variants
      const price = (typeof pricing.minPrice === 'number' ? pricing.minPrice : undefined) ??
        (typeof pricing.price === 'number' ? pricing.price : undefined) ??
        0;

      // If minPrice > 0, the product is orderable (has active variants with price)
      // This avoids fetching variants separately
      const isOrderable = price > 0;

      // IMPORTANT: Do not set the UI to a default placeholder image up-front.
      // If the list payload does not contain an image path, keep it empty so the UI can
      // show a neutral skeleton until the background enrichment resolves the real image.
      const imagePath = resolveProductImagePath(p);
      const imageUrl = imagePath ? getProductImageUrl(imagePath) : '';
      const fallbackCategoryName =
        (typeof p.categoryName === 'string' && p.categoryName) || '';
      const fallbackCategoryNameAr =
        (typeof p.categoryNameAr === 'string' && p.categoryNameAr) || '';

      const numericCategoryId =
        (typeof p.categoryId === 'number' ? p.categoryId : undefined) ??
        (p.category && typeof (p.category as unknown as { id?: number }).id === 'number'
          ? (p.category as unknown as { id: number }).id
          : undefined);
      const categoryIdString =
        numericCategoryId !== undefined ? String(numericCategoryId) : undefined;

      const categorySlug =
        (p.category && typeof (p.category as unknown as { slug?: string }).slug === 'string'
          ? (p.category as unknown as { slug: string }).slug
          : undefined) ??
        (typeof p.categorySlug === 'string' ? p.categorySlug : undefined);

      const categoryNameEn =
        (p.category as unknown as { name?: string } | undefined)?.name ||
        fallbackCategoryName ||
        fallbackCategoryNameAr;
      const categoryNameAr =
        (p.category as unknown as { nameAr?: string } | undefined)?.nameAr ||
        fallbackCategoryNameAr ||
        categoryNameEn;

      const isLimited =
        typeof (p as unknown as { isLimited?: unknown }).isLimited === 'boolean'
          ? ((p as unknown as { isLimited: boolean }).isLimited as boolean)
          : typeof (p as unknown as { IsLimited?: unknown }).IsLimited === 'boolean'
            ? ((p as unknown as { IsLimited: boolean }).IsLimited as boolean)
            : undefined;

      const isPremium =
        typeof (p as unknown as { isPremium?: unknown }).isPremium === 'boolean'
          ? ((p as unknown as { isPremium: boolean }).isPremium as boolean)
          : typeof (p as unknown as { IsPremium?: unknown }).IsPremium === 'boolean'
            ? ((p as unknown as { IsPremium: boolean }).IsPremium as boolean)
            : undefined;

      if (!hasValue(p.id)) {
        return null;
      }

      return {
        id: String(p.id),
        slug: typeof p.slug === 'string' ? p.slug : undefined,
        isActive: (p as unknown as { isActive?: boolean }).isActive,
        isOrderable,
        isLimited,
        isPremium,
        name: String(p.name || p.nameAr || ''),
        nameAr: p.nameAr ? String(p.nameAr) : undefined,
        description: String(p.description || p.descriptionAr || ''),
        descriptionAr: p.descriptionAr ? String(p.descriptionAr) : undefined,
        price,
        image: imageUrl,
        categoryId: categoryIdString,
        categorySlug,
        category: categoryNameEn ? String(categoryNameEn) : '',
        categoryAr: categoryNameAr ? String(categoryNameAr) : undefined,
        tastingNotes:
          p.tastingNotes ? String(p.tastingNotes) : (p.tastingNotesAr ? String(p.tastingNotesAr) : undefined),
        tastingNotesAr: p.tastingNotesAr ? String(p.tastingNotesAr) : undefined,
        origin: p.origin ? String(p.origin) : undefined,
        originAr: p.originAr ? String(p.originAr) : undefined,
        process: p.process ? String(p.process) : undefined,
        processAr: p.processAr ? String(p.processAr) : undefined,
        variety: p.variety ? String(p.variety) : undefined,
        varietyAr: p.varietyAr ? String(p.varietyAr) : undefined,
        roastLevel: p.roastLevel ? String(p.roastLevel) : undefined,
        roastLevelAr: p.roastLevelAr ? String(p.roastLevelAr) : undefined,
        uses: p.uses ? String(p.uses) : undefined,
        usesAr: p.usesAr ? String(p.usesAr) : undefined,
        featured: p.isFeatured,
        topTags: normalizeProductTags((p as Record<string, unknown>).topTags, 'Top'),
        bottomTags: normalizeProductTags((p as Record<string, unknown>).bottomTags, 'Bottom'),
        // Pre-built searchable text to avoid string concatenation during filtering
        _searchText: `${String(p.name || '')} ${p.nameAr ? String(p.nameAr) : ''} ${String(p.description || '')} ${p.descriptionAr ? String(p.descriptionAr) : ''} ${categoryNameEn || ''} ${categoryNameAr || ''}`.toLowerCase(),
      } satisfies Product;
    })
    .filter((p): p is Product => p !== null)
    .filter((p) => (p as unknown as { isActive?: boolean }).isActive !== false);
};

/**
 * Validate and transform an SSR-injected products bootstrap, safely ignoring
 * anything malformed or scoped to a different region than the one currently
 * being rendered (e.g. a stale/mismatched `window.__SSR_PRODUCTS__`).
 */
export const resolveBootstrapProducts = (
  bootstrap: ProductsSsrBootstrap | null | undefined,
  currentRegionCode: string,
): Product[] => {
  if (!bootstrap || typeof bootstrap !== 'object') return [];
  if (bootstrap.region !== currentRegionCode) return [];
  if (!Array.isArray(bootstrap.products) || bootstrap.products.length === 0) return [];

  try {
    return transformApiProductsToProducts(bootstrap.products as ApiProduct[]);
  } catch {
    return [];
  }
};
