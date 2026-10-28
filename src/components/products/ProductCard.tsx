import React, { lazy, memo, Suspense, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import { useRegion } from '../../hooks/useRegion';
import { useApp } from '../../hooks/useApp';
import { formatPrice } from '../../lib/regionUtils';
import type { Product } from '../../contexts/AppContextDefinition';
import { buildResponsiveSrcSet, getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { ProductTagBadge } from '../shop/ProductTagBadge';
import { OmaniRialPrice } from '../ui/OmaniRialPrice';
import { personalizationService } from '../../services/personalizationService';

const ProductQuickView = lazy(() =>
  import('./ProductQuickView').then((module) => ({ default: module.ProductQuickView })),
);

interface ProductCardProps {
  product: Product;
  prioritizeImage?: boolean;
  /** 'homepage' applies the premium homepage presentation (subtle border, plain price format, no Price label). Defaults to the standard look used on the Shop/Products pages. */
  variant?: 'default' | 'homepage';
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, prioritizeImage = false, variant = 'default' }) => {
  const isHomepage = variant === 'homepage';
  const { t } = useTranslation();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { addToCart, openCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { currentRegion } = useRegion();
  const productUrl = `/${currentRegion.code}/products/${product.slug || product.id}`;
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClosingQuickView, setIsClosingQuickView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // NOTE: Variant fetching removed - not needed for product list display
  // Variants are only fetched when user opens ProductQuickView or ProductDetailPage

  const isWishlisted = isFavorite(product.id);
  const productImage = product.image || getProductImageUrl(undefined);
  const productName = isArabic ? product.nameAr || product.name : product.name;
  const productDescription = isArabic
    ? product.descriptionAr || product.description
    : product.description;
  const productCategory = isArabic ? product.categoryAr || product.category : product.category;
  const productTastingNotes = isArabic
    ? product.tastingNotesAr || product.tastingNotes
    : product.tastingNotes;
  const localizedProduct = useMemo(
    () => ({
      ...product,
      name: productName,
      description: productDescription,
      category: productCategory,
      tastingNotes: productTastingNotes,
    }),
    [product, productCategory, productDescription, productName, productTastingNotes],
  );
  // Memoize srcSet generation to avoid creating 4 new URL objects on every render
  const productImageSrcSet = useMemo(
    () => buildResponsiveSrcSet(productImage),
    [productImage]
  );

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking wishlist
    
    // Convert Product to FavoriteItem format
    const favoriteItem = {
      id: product.id,
      slug: product.slug,
      name: productName,
      price: product.price,
      image: product.image || getProductImageUrl(undefined),
      category: productCategory,
      rating: 4.5 // Default rating since Product doesn't have rating field
    };
    
    toggleFavorite(favoriteItem);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    if (isAnimating) return;
    if (product.isOrderable === false || product.price <= 0) return;
    
    setIsAnimating(true);
    
    // Parse productId from string ID
    const productId = parseInt(product.id, 10);

    // Add to cart - variant will be selected in QuickView or Detail page
    addToCart({
      id: product.id,
      productId: isNaN(productId) ? 0 : productId,
      productVariantId: null,
      name: productName,
      price: product.price,
      image: product.image || getProductImageUrl(undefined),
      tastingNotes: productTastingNotes,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
    });
    personalizationService.trackEvent({
      eventType: 'add_to_cart',
      productId,
      categoryId: Number(product.categoryId) || undefined,
      language,
      country: currentRegion.code,
      source: 'product_card',
    });

    // Wait for animation
    setTimeout(() => {
      setIsAnimating(false);
      openCart();
    }, 800);
  };

  if (product.isOrderable === false) {
    return null;
  }

  const handleProductLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't navigate if quick view modal is open or in the process of closing
    if (showQuickView || isClosingQuickView) {
      event.preventDefault();
      return;
    }
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking quick view
    setShowQuickView(true);
  };

  const handleQuickViewClose = (open: boolean) => {
    if (!open) {
      // Set flag to prevent navigation
      setIsClosingQuickView(true);
      setShowQuickView(false);
      // Clear the flag after a short delay
      setTimeout(() => {
        setIsClosingQuickView(false);
      }, 300);
    } else {
      setShowQuickView(open);
    }
  };

  return (
    <Card
      ref={cardRef}
      className={
        isHomepage
          ? 'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white py-0 shadow-none transition-shadow duration-300 hover:shadow-[0_16px_36px_-16px_rgba(28,25,23,0.22)]'
          : 'group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md py-0 relative cursor-pointer'
      }
    >
      {/* Wishlist Button - Positioned absolutely in top-right corner */}
      <Button
        size="sm"
        variant="ghost"
        className={`absolute top-2 ${isArabic ? 'left-2' : 'right-2'} z-10 w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md transition-all ${
          isWishlisted 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
        }`}
        onClick={handleToggleWishlist}
        aria-label={isArabic ? (isWishlisted ? 'إزالة من المفضلة' : 'أضف إلى المفضلة') : (isWishlisted ? 'Remove from favorites' : 'Add to favorites')}
        aria-pressed={isWishlisted}
      >
        <AnimatedIcon name="heart" className={`size-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image - Square aspect ratio */}
      <Link
        to={productUrl}
        onClick={handleProductLinkClick}
        aria-label={productName}
        className="relative block overflow-hidden aspect-square bg-[#fbf8f3] focus-visible:outline-2! focus-visible:outline-amber-600! focus-visible:-outline-offset-2"
      >
        <img
          src={productImage}
          srcSet={productImageSrcSet}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 319px"
          alt={productName}
          className="w-full h-full object-cover"
          loading={prioritizeImage ? 'eager' : 'lazy'}
          fetchPriority={prioritizeImage ? 'high' : 'auto'}
          decoding="async"
          onError={(e) => handleImageError(e, '/images/products/default-product.webp')}
        />
        
        {/* Premium / Limited badges */}
        {(product.isPremium || product.isLimited || (product.topTags && product.topTags.length > 0)) && (
          <div className={`absolute bottom-2 z-10 flex flex-col gap-1 ${isArabic ? 'right-2 items-end' : 'left-2 items-start'}`}>
            {product.isPremium ? (
              <div className="rounded-full bg-[#c69c6d] px-2.5 py-1 text-xs font-bold text-stone-950 shadow-sm">
                {t('sections.bestSellerBadge')}
              </div>
            ) : null}
            {product.isLimited ? (
              <div className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                {t('sections.limitedBadge')}
              </div>
            ) : null}
            {product.topTags?.map((tag) => (
              <ProductTagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        
        {/* Animated clone for cart animation */}
        {isAnimating && (
          <img
            src={productImage}
            alt={productName}
            className="product-card-cart-fly absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ '--cart-fly-x': isArabic ? '-300px' : '300px' } as React.CSSProperties}
          />
        )}
        
        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Product Content - Compact */}
      <CardContent className={isHomepage ? 'flex flex-1 flex-col p-3 pt-1' : 'p-3 pt-1'}>
        {/* Category Badge */}
        {productCategory && (
          <div className="mb-1 min-h-6 flex items-center">
            {isHomepage ? (
              <span className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-stone-400 ${isArabic ? '' : 'uppercase tracking-[0.14em]'}`}>
                {productCategory}
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                {productCategory}
              </span>
            )}
          </div>
        )}
        
        <h3 className={
          isHomepage
            ? 'mb-1 line-clamp-2 min-h-10 text-sm font-semibold text-stone-900 transition-colors group-hover:text-[#8b6f47]'
            : 'font-bold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors min-h-10'
        }>
          <Link
            to={productUrl}
            onClick={handleProductLinkClick}
            className="block focus-visible:outline-2! focus-visible:outline-amber-600! focus-visible:-outline-offset-2"
          >
            {productName}
          </Link>
        </h3>
        <p className={isHomepage ? 'text-xs text-stone-500 mb-2 line-clamp-1' : 'text-xs text-amber-600 mb-2 line-clamp-1'}>
          {productTastingNotes || '---'}
        </p>
        {/* Price at bottom */}
        <div className={isHomepage ? 'mt-auto flex items-center justify-between pt-2 border-t border-stone-100' : 'flex items-center justify-between pt-2 border-t border-gray-100'}>
          {isHomepage ? (
            <span className="text-base font-bold text-stone-900">
              {product.price > 0
                ? formatPrice(product.price, currentRegion.code, isArabic)
                : (isArabic ? 'قريباً' : 'Soon')}
            </span>
          ) : (
            <>
              <span className="text-xs text-gray-400">{isArabic ? 'السعر' : 'Price'}</span>
              {product.price > 0 && currentRegion.code === 'om' ? (
                <OmaniRialPrice
                  amount={product.price}
                  isArabic={isArabic}
                  className="text-lg text-amber-600"
                  amountClassName="font-bold"
                />
              ) : (
                <span className="text-lg font-bold text-amber-600">
                  {product.price > 0
                    ? formatPrice(product.price, currentRegion.code, isArabic)
                    : (isArabic ? 'قريباً' : 'Soon')}
                </span>
              )}
            </>
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
      </CardContent>

      {/* Action Buttons - Compact */}
      <CardFooter className="p-3 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            aria-label={isArabic ? 'عرض سريع' : 'Quick view'}
            className={isHomepage
              ? 'w-9 shrink-0 rounded-lg border-stone-200 px-0 text-stone-600 shadow-none transition-colors hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50'
              : 'border-amber-600 text-amber-600 hover:bg-amber-50 hover:border-amber-700 hover:text-amber-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50'}
            onClick={handleQuickView}
            disabled={isAnimating || product.price <= 0}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            className={isHomepage
              ? 'min-w-0 flex-1 rounded-lg bg-stone-900 px-2 text-white shadow-none transition-colors hover:bg-stone-800 disabled:opacity-50'
              : 'flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50'}
            onClick={handleAddToCart}
            disabled={isAnimating || product.price <= 0}
          >
            <ShoppingCart className="w-3.5 h-3.5 me-1.5" />
            {isHomepage && !isAnimating ? (
              // Narrow phone cards get the short label; it never truncates.
              <span className="truncate text-xs font-semibold">
                <span className="sm:hidden">{isArabic ? 'أضف' : 'Add'}</span>
                <span className="hidden sm:inline">{isArabic ? 'إضافة للسلة' : 'Add to Cart'}</span>
              </span>
            ) : (
              <span className={isHomepage ? 'truncate text-xs font-semibold' : 'text-xs font-semibold'}>
                {isAnimating
                  ? (isArabic ? 'جاري الإضافة...' : 'Adding...')
                  : (isArabic ? 'إضافة للسلة' : 'Add to Cart')}
              </span>
            )}
          </Button>
        </div>
      </CardFooter>

      {/* Quick View Modal */}
      {showQuickView ? (
        <Suspense fallback={null}>
          <ProductQuickView
            product={localizedProduct}
            open
            onOpenChange={handleQuickViewClose}
          />
        </Suspense>
      ) : null}
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
