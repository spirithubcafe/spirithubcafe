import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import type { Product } from '../../contexts/AppContextDefinition';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { ProductQuickView } from './ProductQuickView';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { addToCart, openCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClosingQuickView, setIsClosingQuickView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [defaultVariantId, setDefaultVariantId] = useState<number | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Try to fetch default variant for this product so we always have a variantId when adding to cart
  useEffect(() => {
    let mounted = true;
    const fetchDefault = async () => {
      try {
        const productId = parseInt(product.id, 10);
        if (isNaN(productId)) return;
        const variants = (await import('../../services/productService').then(m => m.productVariantService.getByProduct(productId))) as any[];

        // Business rule: never use inactive variants
        const activeVariants = variants.filter((v) => v?.isActive !== false);

        const defaultVariant = activeVariants.find((v: any) => v.isDefault) ?? activeVariants[0] ?? null;
        if (mounted) {
          setDefaultVariantId(defaultVariant ? defaultVariant.id : null);
          // Check if any variant has a discount and calculate max discount percentage
          let maxDiscount = 0;
          activeVariants.forEach((v: any) => {
            if (v.discountPrice && v.discountPrice > 0 && v.discountPrice < v.price) {
              const percent = Math.round(((v.price - v.discountPrice) / v.price) * 100);
              if (percent > maxDiscount) maxDiscount = percent;
            }
          });
          setHasDiscount(maxDiscount > 0);
          setDiscountPercent(maxDiscount);
        }
      } catch (err) {
        // ignore - optional optimization
        console.debug('No variants loaded for product card', err);
        if (mounted) {
          setDefaultVariantId(null);
          setHasDiscount(false);
          setDiscountPercent(0);
        }
      }
    };
    fetchDefault();
    return () => { mounted = false; };
  }, [product.id]);

  // Reset loading state when the image URL changes (e.g., after background enrichment).
  useEffect(() => {
    setIsImageLoaded(false);
  }, [product.image]);

  const isWishlisted = isFavorite(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking wishlist
    
    // Convert Product to FavoriteItem format
    const favoriteItem = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image || getProductImageUrl(undefined),
      category: product.category,
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
    
    // Determine variant id: prefer fetched defaultVariantId, otherwise null
    const variantId = defaultVariantId ?? null;

    // Add to cart
    addToCart({
      id: product.id,
      productId: isNaN(productId) ? 0 : productId,
      productVariantId: variantId,
      name: product.name,
      price: product.price,
      image: product.image || getProductImageUrl(undefined),
      tastingNotes: product.tastingNotes,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
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

  const handleCardClick = () => {
    // Don't navigate if quick view modal is open or in the process of closing
    if (showQuickView || isClosingQuickView) {
      return;
    }
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/products/${product.slug || product.id}`);
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
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md py-0 relative cursor-pointer"
      onClick={handleCardClick}
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
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image - Square aspect ratio */}
      <div className="relative overflow-hidden aspect-square">
        {/* Skeleton/placeholder while the real image is loading */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" aria-hidden="true" />
        )}

        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={(event) => {
              setIsImageLoaded(true);
              handleImageError(event, '/images/products/default-product.webp');
            }}
          />
        ) : null}
        
        {/* Sale Badge */}
        {hasDiscount && (
          <div className={`absolute top-2 bg-linear-to-r from-red-500 to-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg z-10 ${isArabic ? 'right-2' : 'left-2'}`}>
            {isArabic ? `تخفيض ${discountPercent}٪` : `SALE ${discountPercent}%`}
          </div>
        )}

        {/* Premium / Limited badges */}
        {(product.isPremium || product.isLimited) && (
          <div className={`absolute bottom-2 z-10 flex flex-col gap-1 ${isArabic ? 'right-2 items-end' : 'left-2 items-start'}`}>
            {product.isPremium ? (
              <div className="bg-linear-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                {t('sections.bestSellerBadge')}
              </div>
            ) : null}
            {product.isLimited ? (
              <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                {t('sections.limitedBadge')}
              </div>
            ) : null}
          </div>
        )}
        
        {/* Animated clone for cart animation */}
        {isAnimating && (
          <motion.img
            src={product.image || getProductImageUrl(undefined)}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            initial={{ scale: 1, opacity: 1, y: 0, x: 0 }}
            animate={{
              scale: [1, 0.8, 0],
              opacity: [1, 1, 0],
              y: [0, -20, -100],
              x: isArabic ? [0, -100, -300] : [0, 100, 300],
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}
        
        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Product Content - Compact */}
      <CardContent className="p-3 pt-1">
        {/* Category Badge */}
        {product.category && (
          <div className="mb-1 min-h-6 flex items-center">
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {product.category}
            </span>
          </div>
        )}
        
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors min-h-10">
          {product.name}
        </h3>
        <p className="text-xs text-amber-600 mb-2 line-clamp-1">
          {(isArabic ? product.tastingNotesAr : product.tastingNotes) || '---'}
        </p>
        {/* Price at bottom */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">{isArabic ? 'السعر' : 'Price'}</span>
          <span className="text-lg font-bold text-amber-600">
            {product.price > 0 
              ? `${product.price.toFixed(3)} ${isArabic ? 'ر.ع' : 'OMR'}` 
              : (isArabic ? 'قريباً' : 'Soon')}
          </span>
        </div>
      </CardContent>

      {/* Action Buttons - Compact */}
      <CardFooter className="p-3 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-50 hover:border-amber-700 hover:text-amber-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            onClick={handleQuickView}
            disabled={isAnimating || product.price <= 0}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            onClick={handleAddToCart}
            disabled={isAnimating || product.price <= 0}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs font-semibold">
              {isAnimating 
                ? (isArabic ? 'جاري الإضافة...' : 'Adding...') 
                : (isArabic ? 'إضافة للسلة' : 'Add to Cart')}
            </span>
          </Button>
        </div>
      </CardFooter>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        open={showQuickView}
        onOpenChange={handleQuickViewClose}
      />
    </Card>
  );
};
