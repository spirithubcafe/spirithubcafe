import { Link } from 'react-router-dom';
import type { ShopCategory } from '../../types/shop';
import { getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { ProductCard } from './ProductCard';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';

interface Props {
  category: ShopCategory;
}

export const CategorySection = ({ category }: Props) => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';
  const name = isArabic ? category.nameAr || category.name : category.name;
  const description = isArabic ? category.descriptionAr || category.description : category.description;

  return (
    <section id={`category-${category.slug}`} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {category.imagePath && (
            <img
              src={getCategoryImageUrl(category.imagePath)}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover"
              loading="lazy"
              onError={(event) => handleImageError(event, '/images/header.webp')}
            />
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-stone-900">{name}</h2>
            {description && (
              <div
                className="text-sm text-stone-600 max-w-xl leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
            <span className="text-xs font-medium text-stone-500">
              {category.productCount} {isArabic ? 'منتج' : 'products'}
            </span>
          </div>
        </div>
        <Link
          to={`/${currentRegion.code}/shop/${category.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
        >
          {isArabic ? 'عرض الكل' : 'View All'} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {category.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
