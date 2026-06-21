import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink, ShoppingBag, ShoppingCart, Star } from 'lucide-react';
import type { ChatProduct } from '../../services/geminiChatService';
import { formatPrice as formatRegionalPrice, type RegionCode } from '../../lib/regionUtils';
import { useCart } from '../../hooks/useCart';
import { personalizationService } from '../../services/personalizationService';

interface ProductCardProps {
  product: ChatProduct;
  regionPrefix: string;
  language: string;
}

const AR_LABELS = {
  price: '\u0627\u0644\u0633\u0639\u0631',
  priceRange: '\u0646\u0637\u0627\u0642 \u0627\u0644\u0633\u0639\u0631',
  priceOnRequest: '\u0627\u0644\u0633\u0639\u0631 \u0639\u0646\u062f \u0627\u0644\u0637\u0644\u0628',
  quickView: '\u0639\u0631\u0636 \u0633\u0631\u064a\u0639',
  viewProduct: '\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c',
  addToCart: '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629',
  selectOptions: '\u0627\u062e\u062a\u0631 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a',
  match: '\u0645\u0637\u0627\u0628\u0642',
};

const CATEGORY_AR: Record<string, string> = {
  coffee: '\u0642\u0647\u0648\u0629',
  'filter & pour-over coffee': '\u0642\u0647\u0648\u0629 \u0641\u0644\u062a\u0631 \u0648\u0628\u0648\u0631 \u0623\u0648\u0641\u0631',
  'filter and pour-over coffee': '\u0642\u0647\u0648\u0629 \u0641\u0644\u062a\u0631 \u0648\u0628\u0648\u0631 \u0623\u0648\u0641\u0631',
  'espresso coffee': '\u0642\u0647\u0648\u0629 \u0625\u0633\u0628\u0631\u064a\u0633\u0648',
  equipment: '\u0645\u0639\u062f\u0627\u062a',
  accessories: '\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062a',
  'gift cards': '\u0628\u0637\u0627\u0642\u0627\u062a \u0647\u062f\u0627\u064a\u0627',
  'electronic gift cards': '\u0628\u0637\u0627\u0642\u0627\u062a \u0647\u062f\u0627\u064a\u0627 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629',
  'digital gift cards': '\u0628\u0637\u0627\u0642\u0627\u062a \u0647\u062f\u0627\u064a\u0627 \u0631\u0642\u0645\u064a\u0629',
};

const getProductPathSegment = (value: string | number): string => {
  const raw = String(value).trim();
  if (!raw) return '';

  let path = raw;
  try {
    path = new URL(raw, 'https://www.spirithubcafe.com').pathname;
  } catch {
    path = raw.split('?')[0].split('#')[0];
  }

  return path
    .replace(/^\/?(om|sa)\//i, '')
    .replace(/^\/?(shop\/product|products|product)\//i, '')
    .replace(/^\/+/, '')
    .split('?')[0]
    .split('#')[0]
    .trim();
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, regionPrefix, language }) => {
  const [imgError, setImgError] = useState(false);
  const { addToCart, openCart } = useCart();
  const isAr = language === 'ar';
  const displayName = isAr && product.nameAr ? product.nameAr : product.name;
  const displayCategory = isAr && product.category
    ? CATEGORY_AR[product.category.trim().toLowerCase()]
    : product.category;
  const tastingNotes = isAr ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes;
  const productPathSegment = getProductPathSegment(product.slug || product.id) || String(product.id);
  const productUrl = `${regionPrefix}/shop/product/${productPathSegment}`;
  const region: RegionCode = regionPrefix.startsWith('/sa') ? 'sa' : 'om';

  const formatPrice = (price: number) => {
    if (price <= 0) return null;
    return formatRegionalPrice(price, region, isAr);
  };

  const minPrice = product.minPrice && product.minPrice > 0 ? product.minPrice : product.price;
  const hasDiscount = !!product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const canQuickAdd = minPrice > 0;
  const priceText = hasDiscount
    ? formatPrice(product.discountPrice as number)
    : formatPrice(minPrice);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canQuickAdd) return;

    addToCart({
      id: product.productVariantId ? `${product.id}-${product.productVariantId}` : `${product.id}`,
      productId: product.id,
      productVariantId: product.productVariantId ?? null,
      name: displayName,
      price: hasDiscount ? product.discountPrice as number : minPrice,
      image: product.imageUrl ?? '/images/products/default-product.webp',
      tastingNotes: tastingNotes ?? product.category,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
    });
    personalizationService.trackEvent({
      eventType: 'add_to_cart',
      productId: product.id,
      language,
      country: region,
      source: 'chatbot',
      metadata: { recommendation: true },
    });
    openCart();
  };

  const handleRecommendationClick = () => {
    personalizationService.trackEvent({
      eventType: 'chatbot_recommendation_click',
      productId: product.id,
      language,
      country: region,
      source: 'chatbot',
    });
  };

  return (
    <div
      className="group overflow-hidden rounded-2xl border border-[#f2ddd8] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e9b8b0] hover:shadow-lg"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-2.5 p-2.5">
        <Link
          to={productUrl}
          className="relative block aspect-square overflow-hidden rounded-xl bg-[#f8f1ed]"
          aria-label={displayName}
          onClick={handleRecommendationClick}
        >
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#faf5f1] to-[#fff1ed] text-[#c75049]">
              <ShoppingBag className="h-7 w-7 opacity-55" />
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <Link
            to={productUrl}
            className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 transition-colors hover:text-[#c75049]"
            onClick={handleRecommendationClick}
          >
            {displayName}
          </Link>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            {displayCategory && (
              <span className="min-w-0 max-w-[150px] truncate rounded-full bg-[#f8f1ed] px-2 py-1 text-[11px] font-medium text-stone-600">
                {displayCategory}
              </span>
            )}
            {product.matchPercentage && product.matchPercentage > 0 && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-[#eef7e9] px-2 py-1 text-[11px] font-extrabold text-[#5f9b54]">
                {product.matchPercentage}% {isAr ? AR_LABELS.match : 'match'}
              </span>
            )}
            {product.rating && product.rating > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff1ed] px-2 py-1 text-[11px] font-semibold text-[#c75049]">
                <Star className="h-3 w-3 fill-[#f4b15f] text-[#f4b15f]" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          {tastingNotes && (
            <p className="mt-1.5 line-clamp-1 text-[11px] font-medium leading-snug text-stone-500">
              {tastingNotes}
            </p>
          )}

          <div className="mt-2 rounded-xl bg-[#fff1ed] px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase text-[#c75049]/70">
                {isAr ? AR_LABELS.price : 'Price'}
              </span>
              <span className="min-w-0 text-sm font-extrabold leading-tight text-[#8e4e47]">
                {priceText ?? (isAr ? AR_LABELS.priceOnRequest : 'Price on request')}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs font-semibold text-stone-400">
              {hasDiscount && (
                <span className="line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#f4e6e1] bg-[#fffaf7]/90 px-3 py-1.5">
        <Link
          to={productUrl}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-white hover:text-[#c75049]"
          onClick={handleRecommendationClick}
        >
          <Eye className="h-3.5 w-3.5" />
          {isAr ? AR_LABELS.viewProduct : 'View Product'}
        </Link>
        <div className="flex items-center gap-1.5">
          {canQuickAdd ? (
            <button
              type="button"
              onClick={handleAddToCart}
              title={isAr ? AR_LABELS.addToCart : 'Add to cart'}
              aria-label={isAr ? AR_LABELS.addToCart : 'Add to cart'}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-bold text-[#5f9b54] shadow-sm ring-1 ring-[#dfead6] transition-colors hover:bg-[#5f9b54] hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{isAr ? '\u0623\u0636\u0641' : 'Add'}</span>
            </button>
          ) : (
            <Link
              to={productUrl}
              title={isAr ? AR_LABELS.selectOptions : 'Select options'}
              aria-label={isAr ? AR_LABELS.selectOptions : 'Select options'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#5f9b54] shadow-sm ring-1 ring-[#dfead6] transition-colors hover:bg-[#5f9b54] hover:text-white"
              onClick={handleRecommendationClick}
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
          )}
          <Link
            to={productUrl}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#c75049] shadow-sm ring-1 ring-[#f2ddd8] transition-colors hover:bg-[#df6d64] hover:text-white"
            aria-label={displayName}
            onClick={handleRecommendationClick}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
