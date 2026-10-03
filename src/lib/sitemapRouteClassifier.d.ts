export interface SitemapCategoryLike {
  id?: number | string | null;
  slug?: string | null;
  categorySlug?: string | null;
}

export interface SitemapProductLike {
  id?: number | string | null;
  slug?: string | null;
  productSlug?: string | null;
  categoryId?: number | string | null;
  category?: {
    id?: number | string | null;
    slug?: string | null;
  } | null;
  categorySlug?: string | null;
}

export interface ShopCategoryLookup {
  ids: Set<number>;
  slugs: Set<string>;
}

export function createShopCategoryLookup(
  shopCategories: SitemapCategoryLike[] | null | undefined,
): ShopCategoryLookup;

export function getOmanSitemapCategoryPath(
  category: SitemapCategoryLike | null | undefined,
  shopCategoryLookup: ShopCategoryLookup,
): string | null;

export function getOmanSitemapProductPath(
  product: SitemapProductLike | null | undefined,
  shopCategoryLookup: ShopCategoryLookup,
): string | null;
