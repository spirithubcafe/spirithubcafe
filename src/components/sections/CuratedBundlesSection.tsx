import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { useShopCategory, useCategoryProducts } from '../../hooks/useShop';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { formatPrice, getCurrencyByRegion, getCurrencySymbolByRegion } from '../../lib/regionUtils';

const BUNDLE_CATEGORY_SLUG = 'coffee-bundles-gift-boxes';

// Homepage cards use a shorter display title; product data/URLs are untouched.
const shortenBundleName = (fullName: string): string =>
  fullName
    .replace(/^coffee discovery bundle\s*[–-]\s*/i, '')
    .replace(/\s+discovery\s*$/i, '')
    .trim();

export const CuratedBundlesSection: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  const { category, loading: categoryLoading } = useShopCategory(BUNDLE_CATEGORY_SLUG);
  const { products, loading: productsLoading } = useCategoryProducts(category?.id ?? 0);
  const loading = categoryLoading || (Boolean(category) && productsLoading);
  const bundles = products.slice(0, 4);

  if (!loading && bundles.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#fbfbf9] pt-14 pb-6 sm:pt-20 sm:pb-10" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
            {isArabic ? 'تفضل تشكيلة جاهزة؟' : 'Prefer a ready-made selection?'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
              {isArabic ? 'حزم قهوة مختارة' : 'Curated Coffee Bundles'}
            </h2>
            <Link
              to={`/${currentRegion.code}/shop/${BUNDLE_CATEGORY_SLUG}`}
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-stone-900 hover:text-amber-700"
            >
              {isArabic ? 'عرض كل الحزم' : 'View all bundles'}
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                  <div className="aspect-[4/3] w-full animate-pulse bg-stone-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-stone-50" />
                    <div className="h-8 w-full animate-pulse rounded-lg bg-stone-100" />
                  </div>
                </div>
              ))
            : bundles.map((product) => {
                const name = shortenBundleName(isArabic ? product.nameAr || product.name : product.name);
                const notes = isArabic ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes;
                const productSlug = product.slug || `${product.id}`;
                const priceLabel = product.minPrice === null || product.minPrice === undefined
                  ? null
                  : product.maxPrice && product.maxPrice !== product.minPrice
                    ? currentRegion.code === 'om'
                      ? `${getCurrencySymbolByRegion(currentRegion.code)} ${product.minPrice.toFixed(3)}–${product.maxPrice.toFixed(3)}`
                      : `${product.minPrice.toFixed(3)}–${product.maxPrice.toFixed(3)} ${isArabic ? getCurrencySymbolByRegion(currentRegion.code) : getCurrencyByRegion(currentRegion.code)}`
                    : formatPrice(product.minPrice, currentRegion.code, isArabic);
                return (
                  <Link
                    key={product.id}
                    to={`/${currentRegion.code}/shop/product/${productSlug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                      <img
                        src={getProductImageUrl(product.mainImagePath)}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                        {isArabic ? 'حزمة مختارة' : 'Curated Bundle'}
                      </p>
                      <h3 className="text-sm font-bold text-stone-900 sm:text-base">{name}</h3>
                      {notes && <p className="line-clamp-1 text-xs text-stone-500">{notes}</p>}
                      <div className="mt-auto flex flex-col gap-1.5 pt-2">
                        {priceLabel && <p className="text-sm font-bold text-stone-900 sm:text-base">{priceLabel}</p>}
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white transition group-hover:bg-amber-600">
                          {isArabic ? 'التفاصيل' : 'View details'}
                          <Arrow className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
};
