import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';
import { handleImageError } from '../../lib/imageUtils';

export const CategoriesSection: React.FC = () => {
  const { t } = useTranslation();
  const { categories, loading } = useApp();
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`);
  };

  // Filter categories for homepage display and sort by displayOrder
  const homepageCategories = categories
    .filter(cat => cat.isDisplayedOnHomepage !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

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

  if (!homepageCategories || homepageCategories.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            {t('sections.noCategories') || 'No categories available'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
            {t('sections.categories') || 'Our Categories'}
          </h2>
        </div>

        {/* Categories Grid - 5 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {homepageCategories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
              onClick={() => handleCategoryClick(category.id)}
            >
              {/* Category Image */}
              <div className="relative overflow-hidden rounded-lg aspect-square mb-4 border border-gray-200 group-hover:border-amber-400 transition-all duration-300">
                <img
                  src={category.image || '/images/slides/slide1.webp'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => handleImageError(e, '/images/slides/slide1.webp')}
                  loading="lazy"
                />
                
                {/* Subtle Overlay on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </div>
              
              {/* Category Content Below Image */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-200">
                  {category.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};