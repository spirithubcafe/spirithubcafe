import React from 'react';
import { Link } from 'react-router-dom';
import { useShopPage } from '../../hooks/useShop';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';

export const ShopCategoriesSection: React.FC = () => {
  const { shopData, loading } = useShopPage();
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="h-7 w-52 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-stone-100" />
          </div>
          {/* Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm border border-stone-100"
              >
                <div className="h-20 w-20 animate-pulse rounded-full bg-stone-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
                <div className="h-3 w-14 animate-pulse rounded bg-stone-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!shopData || shopData.categories.length === 0) {
    return null;
  }

  const categories = shopData.categories;

  return (
    <section className="py-16 bg-gradient-to-b from-stone-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
            {isArabic ? 'تسوق حسب الفئة' : 'SHOP BY CATEGORY'}
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => {
            const name = isArabic
              ? category.nameAr || category.name
              : category.name;
            const imageUrl = getCategoryImageUrl(category.imagePath);

            return (
              <Link
                key={category.id}
                to={`/${currentRegion.code}/shop/${category.slug}`}
                className="group w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)]"
              >
                {/* Category Card */}
                <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-gray-200 h-full flex flex-col">
                  {/* Category Image */}
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      onError={(e) => handleImageError(e, '/images/slides/slide1.webp')}
                    />
                    
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Category Content */}
                  <div className="p-4 flex-1 flex flex-col justify-center items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-200 line-clamp-2 min-h-[3rem] text-center">
                        {name}
                      </h3>
                    </div>
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
