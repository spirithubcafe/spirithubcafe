import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';

export const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const { products, loading } = useApp();

  // Show all products (not just featured ones)
  const displayProducts = products.slice(0, 6);

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

  return (
    <section id="products" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('sections.featuredProducts')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Products Grid - 6 columns in one row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};