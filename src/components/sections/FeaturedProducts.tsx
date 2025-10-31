import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';

export const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const { products, loading } = useApp();

  const featuredProducts = products.filter(product => product.featured);

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
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('sections.featuredProducts')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Products Button */}
        {featuredProducts.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors duration-200">
              {t('nav.products')} - {t('products.viewDetails')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};