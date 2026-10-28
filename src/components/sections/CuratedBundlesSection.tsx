import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { useShopCategory, useCategoryProducts } from '../../hooks/useShop';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { formatPrice, getCurrencyByRegion, getCurrencySymbolByRegion } from '../../lib/regionUtils';
import { HOMEPAGE_CARD, HOMEPAGE_CARD_HOVER, homepageContainerClassName, homepageSectionClassName } from './homepageSectionSpacing';
import { HomeSectionHeader } from './HomeSectionHeader';

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

  const { category, loading: categoryLoading } = useShopCategory(BUNDLE_CATEGORY_SLUG);
  const { products, loading: productsLoading } = useCategoryProducts(category?.id ?? 0);
  const loading = categoryLoading || (Boolean(category) && productsLoading);
  const bundles = products.slice(0, 4);

  if (!loading && bundles.length === 0) {
    return null;
  }

  return (
    <section className={homepageSectionClassName('bg-[#fbfbf9]')} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={homepageContainerClassName()}>
        <HomeSectionHeader
          eyebrow={isArabic ? 'تفضل تشكيلة جاهزة؟' : 'Prefer a ready-made selection?'}
          title={isArabic ? 'حزم قهوة مختارة' : 'Curated Coffee Bundles'}
          action={{
            label: isArabic ? 'عرض كل الحزم' : 'View all bundles',
            to: `/${currentRegion.code}/shop/${BUNDLE_CATEGORY_SLUG}`,
          }}
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                // Same row heights as the loaded card below (skeleton parity).
                <div key={index} className={`flex h-full flex-col ${HOMEPAGE_CARD}`} aria-hidden="true">
                  <div className="aspect-[4/3] w-full animate-pulse bg-stone-100" />
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <div className="h-4 py-0.5"><div className="h-full w-1/3 animate-pulse rounded bg-stone-100" /></div>
                    <div className="h-10 py-1 sm:h-12"><div className="h-4 w-3/4 animate-pulse rounded bg-stone-100 sm:h-5" /></div>
                    <div className="h-4 py-0.5"><div className="h-full w-1/2 animate-pulse rounded bg-stone-50" /></div>
                    <div className="mt-auto flex flex-col gap-1.5 pt-2">
                      <div className="h-5 py-0.5 sm:h-6"><div className="h-full w-1/3 animate-pulse rounded bg-stone-100" /></div>
                      <div className="h-8 w-full animate-pulse rounded-lg bg-stone-100" />
                    </div>
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
                    className={`group flex h-full flex-col ${HOMEPAGE_CARD} ${HOMEPAGE_CARD_HOVER}`}
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
                      <p className={`h-4 text-[10px] font-semibold leading-4 text-[#8b6f47] ${isArabic ? '' : 'uppercase tracking-[0.18em]'}`}>
                        {isArabic ? 'حزمة مختارة' : 'Curated Bundle'}
                      </p>
                      <h3 className="line-clamp-2 h-10 text-sm font-semibold leading-5 text-stone-900 sm:h-12 sm:text-base sm:leading-6">{name}</h3>
                      <p className="line-clamp-1 h-4 text-xs leading-4 text-stone-500">{notes}</p>
                      <div className="mt-auto flex flex-col gap-1.5 pt-2">
                        <p className="h-5 text-sm font-bold leading-5 text-stone-900 sm:h-6 sm:text-base sm:leading-6">{priceLabel}</p>
                        <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 text-xs font-semibold text-white transition-colors group-hover:bg-stone-800">
                          {isArabic ? 'التفاصيل' : 'View details'}
                          <AnimatedIcon name="arrow-right" className={`size-3.5 ${isArabic ? '-scale-x-100' : ''}`} />
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
