import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useCategoryProducts, useShopCategory, useShopPage } from '../../hooks/useShop';
import { ProductCard } from '../../components/shop/ProductCard';
import { SortDropdown } from '../../components/shop/SortDropdown';
import { getCategoryImageUrl, getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { Seo } from '../../components/seo/Seo';
import { siteMetadata } from '../../config/siteMetadata';
import { PageHeader } from '../../components/layout/PageHeader';
import { ProductBadges } from '../../components/shop/ProductBadges';
import { PriceDisplay } from '../../components/shop/PriceDisplay';
import { StarRating } from '../../components/shop/StarRating';
import type { ShopProduct } from '../../types/shop';
import { useRegion } from '../../hooks/useRegion';

export const ShopCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { category, loading, error } = useShopCategory(slug);
  const { shopData } = useShopPage();
  const { currentRegion } = useRegion();

  const categoryId = category?.id ?? 0;
  const {
    products,
    pagination,
    loading: productsLoading,
    error: productsError,
    page,
    setPage,
    sortBy,
    setSortBy,
    ascending,
    setAscending,
  } = useCategoryProducts(categoryId);

  const pageTitle = useMemo(() => {
    const name = category
      ? isArabic
        ? category.nameAr || category.name
        : category.name
      : isArabic
        ? 'المتجر'
        : 'Shop';
    return isArabic ? `فئة ${name}` : `${name} category`;
  }, [category, isArabic]);

  const shopCategoryIds = useMemo(() => {
    const ids = shopData?.categories?.map((shopCategory) => shopCategory.id) ?? [];
    return new Set(ids);
  }, [shopData]);

  const hasShopProducts = useMemo(() => {
    if (products.length === 0) {
      return false;
    }
    return products.some((product) => shopCategoryIds.has(product.categoryId));
  }, [products, shopCategoryIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Page Header Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-20 md:py-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center">
            <div className="h-9 w-44 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
          {/* Category Info Card Skeleton */}
          <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-stone-100" />
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-stone-50" />
                <div className="h-6 w-40 animate-pulse rounded-lg bg-stone-100" />
              </div>
            </div>
            <div className="h-9 w-36 animate-pulse rounded-lg bg-stone-100" />
          </div>

          {/* Product Cards Grid Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="grid h-full grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr]">
                  <div className="min-h-[200px] animate-pulse bg-stone-100" />
                  <div className="flex flex-col justify-between gap-3 p-4 sm:p-5">
                    <div className="space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-stone-50" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 animate-pulse rounded-lg bg-stone-100" />
                      <div className="h-8 w-28 animate-pulse rounded-full bg-stone-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-9 w-20 animate-pulse rounded-full bg-stone-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">
            {isArabic ? 'تعذر تحميل الفئة' : 'Unable to load category'}
          </h2>
          <p className="mt-3 text-sm text-stone-500">{error}</p>
        </div>
      </div>
    );
  }

  const name = isArabic ? category.nameAr || category.name : category.name;
  const description = isArabic ? category.descriptionAr || category.description : category.description;

  return (
    <div className={`min-h-screen bg-stone-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      <Seo
        title={pageTitle}
        description={description || ''}
        canonical={`${siteMetadata.baseUrl}/shop/${category.slug}`}
        type="website"
      />

      <PageHeader
        title={name}
        titleAr={isArabic ? name : category.nameAr || name}
        subtitle={description || ''}
        subtitleAr={isArabic ? description || '' : category.descriptionAr || description || ''}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {category.imagePath && (
              <img
                src={getCategoryImageUrl(category.imagePath)}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover"
                onError={(event) => handleImageError(event, '/images/header.webp')}
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400">
                {isArabic ? 'فئة' : 'Category'}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-900">{name}</h2>
            </div>
          </div>
          <SortDropdown
            value={sortBy}
            ascending={ascending}
            onChange={(value) => {
              setPage(1);
              setSortBy(value);
            }}
            onToggleDirection={() => {
              setPage(1);
              setAscending((prev) => !prev);
            }}
            isArabic={isArabic}
          />
        </div>

        {productsLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="grid h-full grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr]">
                  <div className="min-h-[200px] animate-pulse bg-stone-100" />
                  <div className="flex flex-col justify-between gap-3 p-4 sm:p-5">
                    <div className="space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-stone-50" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 animate-pulse rounded-lg bg-stone-100" />
                      <div className="h-8 w-28 animate-pulse rounded-full bg-stone-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {productsError && (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-red-500 shadow-sm">
            {productsError}
          </div>
        )}

        {!productsLoading && products.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-stone-600">
              {isArabic ? 'لا توجد منتجات في هذه الفئة' : 'No products in this category'}
            </p>
          </div>
        )}

        {products.length > 0 && (
          <div
            className={
              hasShopProducts
                ? 'grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2'
                : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
            }
          >
            {products.map((product) =>
              shopCategoryIds.has(product.categoryId) ? (
                <BundlesGiftProductCard
                  key={product.id}
                  product={product}
                  isArabic={isArabic}
                  currency={currentRegion.currency}
                  regionCode={currentRegion.code}
                />
              ) : (
                <ProductCard key={product.id} product={product} />
              )
            )}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage(page - 1)}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isArabic ? 'السابق' : 'Previous'}
            </button>
            <span className="text-sm text-stone-500">
              {isArabic ? 'صفحة' : 'Page'} {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage(page + 1)}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isArabic ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BundlesGiftProductCard = ({
  product,
  isArabic,
  currency,
  regionCode,
}: {
  product: ShopProduct;
  isArabic: boolean;
  currency: string;
  regionCode: string;
}) => {
  const name = isArabic ? product.nameAr || product.name : product.name;
  const productSlug = product.slug || `${product.id}`;
  const productUrl = `/${regionCode}/shop/product/${productSlug}`;

  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="grid h-full grid-rows-[150px_1fr] sm:grid-rows-none sm:grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
        {/* Image – fixed height, fully covers left column */}
        <Link
          to={productUrl}
          className="relative block h-full min-h-[150px] sm:min-h-[200px] overflow-hidden bg-stone-100"
        >
          <ProductBadges product={product} />
          <img
            src={getProductImageUrl(product.mainImagePath)}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
          />
        </Link>

        {/* Content */}
        <div className="flex flex-col justify-between gap-3 p-3 sm:p-4 md:p-5">
          {/* Top section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-600">
              {isArabic ? 'حزمة مميزة' : 'Curated Bundle'}
            </p>
            <Link to={productUrl}>
              <h3 className="text-sm font-bold text-stone-900 transition group-hover:text-amber-700 sm:text-base md:text-lg line-clamp-2 text-balance">
                {name}
              </h3>
            </Link>
            {product.reviewCount > 0 ? (
              <StarRating rating={product.averageRating} count={product.reviewCount} />
            ) : (
              <p className="text-[11px] text-stone-400 italic">
                {isArabic ? 'مختار بعناية للإهداء' : 'Thoughtfully packed for gifting'}
              </p>
            )}
          </div>

          {/* Bottom section */}
          <div className="flex items-center justify-between gap-3">
            <PriceDisplay
              minPrice={product.minPrice}
              maxPrice={product.maxPrice}
              currency={currency}
            />
            <Link
              to={productUrl}
              className="shrink-0 rounded-full bg-stone-900 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-stone-800 sm:px-4 sm:py-2 sm:text-xs"
            >
              {isArabic ? 'عرض التفاصيل' : 'View details'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCategoryPage;
