import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useCategoryProducts, useShopCategory } from '../../hooks/useShop';
import { ProductCard } from '../../components/shop/ProductCard';
import { SortDropdown } from '../../components/shop/SortDropdown';
import { getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { Seo } from '../../components/seo/Seo';
import { siteMetadata } from '../../config/siteMetadata';
import { PageHeader } from '../../components/layout/PageHeader';

export const ShopCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { category, loading, error } = useShopCategory(slug);

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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                <div className="h-48 w-full animate-pulse bg-stone-100" />
                <div className="space-y-2.5 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-stone-50" />
                  <div className="h-5 w-24 animate-pulse rounded-lg bg-stone-100" />
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-64 animate-pulse rounded-2xl bg-stone-200" />
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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

export default ShopCategoryPage;
