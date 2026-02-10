import { useState } from 'react';
import type { ShopCategory } from '../../types/shop';
import { getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { useApp } from '../../hooks/useApp';

export type CategoryFilter = 'all' | 'bundles' | 'gift-cards' | 'under-15';

interface Props {
  categories: ShopCategory[];
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

export const CategoryNav = ({ categories, activeFilter, onFilterChange }: Props) => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const scrollToCategory = (slug: string) => {
    document
      .getElementById(`category-${slug}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-16 z-30 flex flex-col gap-4 rounded-3xl bg-white/95 p-4 shadow-md backdrop-blur">
      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        {[
          { id: 'all', label: isArabic ? 'الكل' : 'All' },
          { id: 'gift-cards', label: isArabic ? 'بطاقات هدايا ⭐' : 'Gift Cards ⭐' },
          { id: 'bundles', label: isArabic ? 'الباقات' : 'Bundles' },
          { id: 'under-15', label: isArabic ? 'اقل من 15 ر.ع' : 'Under 15 OMR' },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              setActiveCategorySlug(null);
              onFilterChange(chip.id as CategoryFilter);
            }}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              activeFilter === chip.id
                ? 'border-stone-900 bg-stone-900 text-white shadow-md ring-1 ring-stone-900/20'
                : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setActiveCategorySlug(category.slug);
              scrollToCategory(category.slug);
            }}
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategorySlug === category.slug
                ? 'border-amber-500 bg-amber-600 text-white shadow-sm'
                : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            {category.imagePath && (
              <img
                src={getCategoryImageUrl(category.imagePath)}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
                onError={(event) => handleImageError(event, '/images/header.webp')}
              />
            )}
            <span>{isArabic ? category.nameAr || category.name : category.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
