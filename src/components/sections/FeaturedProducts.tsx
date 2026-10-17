import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Coffee } from 'lucide-react';
import { homepageSectionClassName } from './homepageSectionSpacing';

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

  // `loading` is shared with category fetches and background refreshes; only show
  // the skeleton when there is nothing to display yet, never over loaded products.
  if (loading && latestProducts.length === 0) {
    return <ProductGridSkeleton count={6} />;
  }

  if (!latestProducts || latestProducts.length === 0) {
    return (
      <section id="products" className={homepageSectionClassName('bg-white')}>
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
    <section id="products" className={homepageSectionClassName('bg-white')}>
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
