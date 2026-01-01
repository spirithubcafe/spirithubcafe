import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';

export const BestSellers: React.FC = () => {
  const { t } = useTranslation();
  const { products, loading } = useApp();

  const bestSellerProducts = useMemo(() => {
    const items = (products || []).filter((p) => p.isActive !== false);

    if (items.length === 0) return [];

    // Helper to check if product has a badge (language-agnostic)
    const hasPremiumBadge = (product: any) => 
      product.name?.toLowerCase().includes('floral symphony') ||
      product.name?.toLowerCase().includes('ombligon') ||
      product.nameAr?.includes('سيمفونية') ||
      product.nameAr?.includes('أومبليجون');

    const hasLimitedBadge = (product: any) =>
      product.name?.toLowerCase().includes('aroma nativo') ||
      product.name?.toLowerCase().includes('aji') ||
      product.name?.toLowerCase().includes('lorena') ||
      product.nameAr?.includes('أروما ناتيفو') ||
      product.nameAr?.includes('آجي') ||
      product.nameAr?.includes('ياسي') ||
      product.nameAr?.includes('لورينا');

    // Define which products should have badges
    const badgeProducts = items.filter(product => 
      hasPremiumBadge(product) || hasLimitedBadge(product)
    );

    // Sort helper - stable sort by ID
    const toNumericId = (value: string | undefined | number) => {
      if (!value) return Number.NEGATIVE_INFINITY;
      const n = typeof value === 'number' ? value : Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
    };

    // Group non-badge products by category
    const categoryMap = new Map<number, typeof items>();
    
    items.forEach((product) => {
      // Skip products that already have badges
      const hasBadge = badgeProducts.some(bp => bp.id === product.id);
      if (hasBadge) return;

      const catId = product.categoryId ?? 0;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, []);
      }
      categoryMap.get(catId)!.push(product);
    });

    // Sort products within each category by ID (newest first) - stable sort
    categoryMap.forEach((products) => {
      products.sort((a, b) => toNumericId(b.id) - toNumericId(a.id));
    });

    // Start with badge products sorted by ID for consistency
    const result: typeof items = [...badgeProducts].sort((a, b) => 
      toNumericId(a.id) - toNumericId(b.id)
    );

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
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Spinner className="w-8 h-8" />
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
          {bestSellerProducts.map((product, index) => {
            // Determine badge type for this product
            const hasPremium = product.name?.toLowerCase().includes('floral symphony') ||
              product.name?.toLowerCase().includes('ombligon') ||
              product.nameAr?.includes('سيمفونية') ||
              product.nameAr?.includes('أومبليجون');

            const hasLimited = product.name?.toLowerCase().includes('aroma nativo') ||
              product.name?.toLowerCase().includes('aji') ||
              product.name?.toLowerCase().includes('lorena') ||
              product.nameAr?.includes('أروما ناتيفو') ||
              product.nameAr?.includes('آجي') ||
              product.nameAr?.includes('ياسي') ||
              product.nameAr?.includes('لورينا');

            return (
              <div
                key={product.id}
                className="transform transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  {/* Badge */}
                  {hasPremium && (
                    <div className="absolute bottom-54 left-0 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                      {t('sections.bestSellerBadge')}
                    </div>
                  )}
                  {hasLimited && (
                    <div className="absolute bottom-54 left-0 z-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                      {t('sections.limitedBadge')}
                    </div>
                  )}
                  {index === 2 && !hasPremium && !hasLimited && (
                    <div className="absolute bottom-54 left-0 z-20 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                      {t('sections.baristasChoiceBadge')}
                    </div>
                  )}
                  <ProductCard product={product} />
                </div>
              </div>
            );
          })}
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
