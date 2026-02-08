import type { ShopCategory } from '../../types/shop';
import { getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { useApp } from '../../hooks/useApp';

interface Props {
  categories: ShopCategory[];
}

export const CategoryNav = ({ categories }: Props) => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const scrollToCategory = (slug: string) => {
    document
      .getElementById(`category-${slug}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-16 z-20 flex flex-wrap gap-3 rounded-3xl bg-white/90 p-4 shadow-sm backdrop-blur">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => scrollToCategory(category.slug)}
          className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-400 hover:text-amber-600"
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
          <span className="text-xs text-stone-400">({category.productCount})</span>
        </button>
      ))}
    </nav>
  );
};
