import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Spinner } from '../ui/spinner';
import { Coffee } from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { products, loading } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = i18n.language === 'ar';

  const latestProducts = useMemo(() => {
    const items = (products || []).filter((p) => p.isActive !== false);

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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Spinner className="w-8 h-8" />
          </div>
        </div>
      </section>
    );
  }

  if (!latestProducts || latestProducts.length === 0) {
    return (
      <section id="products" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
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
    <section id="products" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
            {t('sections.featuredProducts')}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};