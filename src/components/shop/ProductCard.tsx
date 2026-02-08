import { Link } from 'react-router-dom';
import type { ShopProduct } from '../../types/shop';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { ProductBadges } from './ProductBadges';
import { PriceDisplay } from './PriceDisplay';
import { StarRating } from './StarRating';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';

interface Props {
  product: ShopProduct;
}

export const ProductCard = ({ product }: Props) => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  const name = isArabic ? product.nameAr || product.name : product.name;
  const tasting = isArabic ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes;
  const productSlug = product.slug || `${product.id}`;
  const productUrl = `/${currentRegion.code}/products/${productSlug}`;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <ProductBadges product={product} />
        <Link to={productUrl} className="block overflow-hidden">
          <img
            src={getProductImageUrl(product.mainImagePath)}
            alt={name}
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <Link to={productUrl} className="block">
            <h3 className="text-base font-semibold text-stone-900 transition group-hover:text-amber-600">
              {name}
            </h3>
          </Link>
        </div>

        {tasting && (
          <p className="text-sm text-stone-600 line-clamp-2">☕ {tasting}</p>
        )}

        {product.reviewCount > 0 && (
          <StarRating rating={product.averageRating} count={product.reviewCount} />
        )}

        <PriceDisplay
          minPrice={product.minPrice}
          maxPrice={product.maxPrice}
          currency={currentRegion.currency}
        />
      </div>
    </div>
  );
};
