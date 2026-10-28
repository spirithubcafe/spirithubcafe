import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Coffee } from 'lucide-react';
import { HOMEPAGE_CONTAINER, homepageSectionClassName } from './homepageSectionSpacing';
import { HomeSectionHeader } from './HomeSectionHeader';

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
    return <ProductGridSkeleton count={6} withDescription />;
  }

  if (!latestProducts || latestProducts.length === 0) {
    return (
      <section id="products" className={homepageSectionClassName('bg-white')}>
        <div className={HOMEPAGE_CONTAINER}>
          <HomeSectionHeader eyebrow={t('sections.featuredProductsEyebrow')} title={t('sections.featuredProducts')} />
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Coffee className="mb-4 size-12 text-stone-300" strokeWidth={1.5} />
            <h3 className="mb-2 text-lg font-semibold text-stone-800">
              {isArabic 
                ? `لا توجد منتجات متاحة في ${currentRegion.nameAr}`
                : `No Products Available in ${currentRegion.name}`
              }
            </h3>
            <p className="max-w-md text-[15px] leading-6 text-stone-500">
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
      <div className={HOMEPAGE_CONTAINER}>
        <HomeSectionHeader
          eyebrow={t('sections.featuredProductsEyebrow')}
          title={t('sections.featuredProducts')}
          description={t('sections.featuredProductsDescription')}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="homepage" />
          ))}
        </div>
      </div>
    </section>
  );
};
