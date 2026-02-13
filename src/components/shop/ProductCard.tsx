import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { ShopProduct } from '../../types/shop';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { ProductBadges } from './ProductBadges';
import { ProductTagBadge } from './ProductTagBadge';
import { PriceDisplay } from './PriceDisplay';
import { StarRating } from './StarRating';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { useCart } from '../../hooks/useCart';

interface Props {
  product: ShopProduct;
}

export const ProductCard = ({ product }: Props) => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const { addToCart, openCart } = useCart();
  const isArabic = language === 'ar';

  const name = isArabic ? product.nameAr || product.name : product.name;
  const tasting = isArabic ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes;
  const productSlug = product.slug || `${product.id}`;
  const productUrl = `/${currentRegion.code}/shop/product/${productSlug}`;
  const priceForCart = product.minPrice ?? product.maxPrice ?? 0;
  const canQuickAdd =
    product.minPrice !== null &&
    product.minPrice !== undefined &&
    (product.maxPrice === null || product.maxPrice === undefined || product.minPrice === product.maxPrice) &&
    priceForCart > 0;

  const handleQuickAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    addToCart({
      id: `${product.id}`,
      productId: product.id,
      productVariantId: null,
      name,
      price: priceForCart,
      image: getProductImageUrl(product.mainImagePath),
      tastingNotes: product.tastingNotes ?? undefined,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
    });
    openCart();
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] active:shadow-md">
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
        <div className="min-h-[3.5rem] space-y-1">
          <Link to={productUrl} className="block">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-stone-900 transition group-hover:text-amber-600">
              {name}
            </h3>
          </Link>
        </div>

        {tasting && (
          <p className="text-sm text-stone-600 line-clamp-2">☕ {tasting}</p>
        )}

        <div className="min-h-5">
          {product.reviewCount > 0 && (
            <StarRating rating={product.averageRating} count={product.reviewCount} />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <PriceDisplay
            minPrice={product.minPrice}
            maxPrice={product.maxPrice}
            currency={currentRegion.currency}
          />
          {canQuickAdd ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={isArabic ? 'إضافة إلى السلة' : 'Add to cart'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to={productUrl}
              aria-label={isArabic ? 'عرض تفاصيل المنتج' : 'View product details'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Bottom Tags */}
        {product.bottomTags && product.bottomTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.bottomTags.map((tag) => (
              <ProductTagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
