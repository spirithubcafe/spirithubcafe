import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Coffee } from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { products, loading } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = i18n.language === 'ar';

  const latestProducts = useMemo(() => {
    const items = (products || []).filter((p) => p.isActive !== false && p.isOrderable !== false && p.price > 0);

    const toNumericId = (value: string | undefined) => {
      if (!value) return Number.NEGATIVE_INFINITY;
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
    };

    return [...items]
      .sort((a, b) => toNumericId(b.id) - toNumericId(a.id))
      .slice(0, 6);
  }, [products]);

  if (loading) {
    return (
      <section className="pt-10 pb-16 bg-[#faf7f2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header Skeleton */}
          <div className="flex flex-col gap-3 mb-12">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
          </div>
          {/* Product Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="aspect-square w-full animate-pulse bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                  <div className="h-4 w-20 animate-pulse rounded-md bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!latestProducts || latestProducts.length === 0) {
    return (
      <section id="products" className="pt-10 pb-16 bg-[#faf7f2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
              {t('sections.featuredProductsEyebrow')}
            </p>
            <h2 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
              {t('sections.featuredProducts')}
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Coffee className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isArabic 
                ? `لا توجد منتجات متاحة في ${currentRegion.nameAr}`
                : `No Products Available in ${currentRegion.name}`
              }
            </h3>
            <p className="text-gray-500 max-w-md">
              {isArabic
                ? 'نعمل على إضافة منتجات جديدة قريباً. يرجى التحقق مرة أخرى لاحقاً.'
                : 'We are working on adding new products soon. Please check back later.'
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="pt-10 pb-16 bg-[#faf7f2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
            {t('sections.featuredProductsEyebrow')}
          </p>
          <h2 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
            {t('sections.featuredProducts')}
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:max-w-xl sm:text-base">
            {t('sections.featuredProductsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="homepage" />
          ))}
        </div>
      </div>
    </section>
  );
};
