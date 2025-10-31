import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';

export const CategoriesSection: React.FC = () => {
  const { t } = useTranslation();
  const { categories, loading, language } = useApp();

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Spinner className="w-8 h-8" />
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('sections.categories')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated coffee categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-amber-300"
            >
              {/* Category Image */}
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback image based on category
                    e.currentTarget.src = '/images/slides/slide1.webp';
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Category Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-amber-200 transition-colors duration-200">
                    {category.name}
                  </h3>
                  <p className="text-sm opacity-90 mb-4">
                    {category.description}
                  </p>
                  
                  {/* Explore Button */}
                  <div className="flex items-center text-amber-200 font-semibold group-hover:text-white transition-colors duration-200">
                    <span className="mr-2">Explore</span>
                    {language === 'ar' ? (
                      <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform duration-200" />
                    ) : (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};