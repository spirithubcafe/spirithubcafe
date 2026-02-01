import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { Spinner } from '../ui/spinner';
import { handleImageError } from '../../lib/imageUtils';
import { Package } from 'lucide-react';

export const CategoriesSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { categories, loading } = useApp();
  const { currentRegion } = useRegion();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`);
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[300px]">
            <Spinner className="w-8 h-8" />
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isArabic 
                ? `لا توجد فئات متاحة في ${currentRegion.nameAr}`
                : `No Categories Available in ${currentRegion.name}`
              }
            </h3>
            <p className="text-gray-500 max-w-md">
              {isArabic
                ? 'نعمل على إضافة فئات جديدة قريباً. يرجى التحقق مرة أخرى لاحقاً.'
                : 'We are working on adding new categories soon. Please check back later.'
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {(t('sections.categories') || 'Categories').toUpperCase()}
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
              onClick={() => handleCategoryClick(category.id)}
            >
              {/* Category Card */}
              <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-gray-200 h-full flex flex-col">
                {/* Category Image */}
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={category.image || '/images/slides/slide1.webp'}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => handleImageError(e, '/images/slides/slide1.webp')}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                  />
                  
                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Category Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-200 line-clamp-2 min-h-[3rem]">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};