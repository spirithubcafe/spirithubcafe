import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';

export const BestSellers: React.FC = () => {
  const { t } = useTranslation();
  const { products, loading } = useApp();

  const bestSellerProducts = useMemo(() => {
    const items = (products || []).filter((p) => p.isActive !== false && p.isOrderable !== false && p.price > 0);

    if (items.length === 0) return [];

    // Sort helper - stable sort by ID
    const toNumericId = (value: string | undefined | number) => {
      if (!value) return Number.NEGATIVE_INFINITY;
      const n = typeof value === 'number' ? value : Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
    };

    // Group products by category
    const categoryMap = new Map<number, typeof items>();
    
    items.forEach((product) => {
      const catId = typeof product.categoryId === 'number' ? product.categoryId : Number(product.categoryId) || 0;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, []);
      }
      categoryMap.get(catId)!.push(product);
    });

    // Sort products within each category by ID (newest first)
    categoryMap.forEach((products) => {
      products.sort((a, b) => toNumericId(b.id) - toNumericId(a.id));
    });

    // Pick products rotating through categories for variety
    const result: typeof items = [];

    // Fill remaining slots with products rotating through categories
    // Sort category IDs for consistent order
    const categories = Array.from(categoryMap.keys()).sort((a, b) => a - b);
    let categoryIndex = 0;

    while (result.length < 6 && categoryMap.size > 0) {
      const catId = categories[categoryIndex % categories.length];
      const categoryProducts = categoryMap.get(catId);

      if (categoryProducts && categoryProducts.length > 0) {
        result.push(categoryProducts.shift()!);
      }

      // Remove empty categories
      if (categoryProducts && categoryProducts.length === 0) {
        categoryMap.delete(catId);
        categories.splice(categoryIndex % categories.length, 1);
        if (categories.length === 0) break;
      } else {
        categoryIndex++;
      }
    }

    return result.slice(0, 6);
  }, [products]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header Skeleton */}
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="h-8 w-52 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>
          {/* Product Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
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

  if (bestSellerProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
            {t('sections.bestSellers')}
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('sections.bestSellersDescription')}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {bestSellerProducts.map((product, index) => (
            <div
              key={product.id}
              className="transform transition-all duration-300 hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                {/* Badges are now handled by ProductCard component */}
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <a
            href="/products"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide"
          >
            {t('sections.viewAllProducts')}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};
