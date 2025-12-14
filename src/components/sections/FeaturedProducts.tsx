import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Spinner } from '../ui/spinner';

export const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const { products, allCategories, loading, language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  const getShortCategoryName = (categoryName: string): string => {
    // Only apply to English category names; Arabic names are already short.
    if (isArabic) return categoryName;
    const shortNames: Record<string, string> = {
      'Espresso Coffee': 'Espresso',
      'Coffee Capsules': 'Capsules',
      'Premium Coffee': 'Premium',
      'Filter Coffee': 'Filter',
      'Drip Coffee': 'Drip',
    };
    return shortNames[categoryName] || categoryName;
  };

  const productsByCategory = useMemo(() => {
    const maxProductsPerCategory = 6;

    const orderedCategories = [...allCategories].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    const grouped = new Map<string, typeof products>();
    for (const product of products) {
      if (!product.categoryId) continue;
      if (!grouped.has(product.categoryId)) grouped.set(product.categoryId, []);
      grouped.get(product.categoryId)!.push(product);
    }

    return orderedCategories
      .map((category) => ({
        category,
        products: (grouped.get(category.id) || []).slice(0, maxProductsPerCategory),
      }))
      .filter((section) => section.products.length > 0);
  }, [allCategories, products]);

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
          <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
            {t('sections.featuredProducts')}
          </h2>
        </div>

        {/* Products by Category */}
        <div className="space-y-12">
          {productsByCategory.map(({ category, products: categoryProducts }) => {
            const categoryParam = category.slug || category.id;
            const categoryProductsUrl = `/${currentRegion.code}/products?category=${encodeURIComponent(categoryParam)}`;

            return (
              <div key={category.id} className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {getShortCategoryName(category.name)}
                  </h3>
                  <Link
                    to={categoryProductsUrl}
                    className="text-sm font-medium text-amber-700 hover:text-amber-800 underline underline-offset-4"
                  >
                    {isArabic ? 'عرض الكل' : 'View All'}
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};