import type { Pagination, PaginatedResponse, ShopCategory, ShopPage, ShopProduct, ShopSsrBootstrap } from '../types/shop';
import { normalizeProductTags } from './productTagUtils.ts';

export const normalizeShopProduct = (product: ShopProduct): ShopProduct => ({
  ...product,
  topTags: normalizeProductTags(product.topTags, 'Top'),
  bottomTags: normalizeProductTags(product.bottomTags, 'Bottom'),
});

export const normalizeShopCategory = (category: ShopCategory): ShopCategory => ({
  ...category,
  products: category.products.map(normalizeShopProduct),
});

export const normalizeShopPage = (page: ShopPage): ShopPage => ({
  ...page,
  categories: page.categories.map(normalizeShopCategory),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isShopProduct = (value: unknown): value is ShopProduct =>
  isRecord(value) &&
  ['id', 'categoryId', 'displayOrder', 'averageRating', 'reviewCount'].every((key) => typeof value[key] === 'number') &&
  ['sku', 'name', 'categoryName'].every((key) => typeof value[key] === 'string') &&
  ['nameAr', 'slug', 'mainImagePath', 'tastingNotes', 'tastingNotesAr'].every((key) => isNullableString(value[key])) &&
  ['minPrice', 'maxPrice'].every((key) => value[key] === null || typeof value[key] === 'number') &&
  ['isFeatured', 'isLimited', 'isPremium'].every((key) => typeof value[key] === 'boolean');

const isShopCategory = (value: unknown): value is ShopCategory =>
  isRecord(value) && typeof value.id === 'number' && typeof value.slug === 'string' &&
  typeof value.name === 'string' && typeof value.shopDisplayOrder === 'number' &&
  typeof value.productCount === 'number' &&
  ['nameAr', 'description', 'descriptionAr', 'imagePath'].every((key) => isNullableString(value[key])) &&
  Array.isArray(value.products) && value.products.every(isShopProduct);

const isShopPage = (value: unknown): value is ShopPage =>
  isRecord(value) && Array.isArray(value.categories) && value.categories.every(isShopCategory) &&
  typeof value.totalCategories === 'number' && typeof value.totalProducts === 'number';

const isPagination = (value: unknown): value is Pagination =>
  isRecord(value) &&
  ['currentPage', 'pageSize', 'totalCount', 'totalPages'].every((key) => typeof value[key] === 'number') &&
  typeof value.hasNextPage === 'boolean' && typeof value.hasPreviousPage === 'boolean';

const isCategoryProducts = (value: unknown): value is PaginatedResponse<ShopProduct> =>
  isRecord(value) && value.success === true && Array.isArray(value.data) &&
  value.data.every(isShopProduct) && isPagination(value.pagination);

export const readShopBootstrap = (value: unknown): ShopSsrBootstrap | null => {
  if (value === null || value === undefined) return null;
  if (
    isRecord(value) && typeof value.categorySlug === 'string' &&
    (value.page === null || isShopPage(value.page)) &&
    (value.category === null || isShopCategory(value.category)) &&
    (value.categoryProducts === null || isCategoryProducts(value.categoryProducts))
  ) {
    return { categorySlug: value.categorySlug, page: value.page, category: value.category, categoryProducts: value.categoryProducts };
  }
  console.warn('[Shop] Ignoring malformed SSR bootstrap');
  return null;
};
