import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, X, Coffee, Star, Loader2, Flame, RotateCw, BarChart3, MapPin, Wheat, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useCart } from '../../hooks/useCart';
import type { Product } from '../../contexts/AppContextDefinition';
import type { Product as ApiProduct, ProductVariant } from '../../types/product';
import { handleImageError, getProductImageUrl, resolveProductImageUrls } from '../../lib/imageUtils';
import { productService } from '../../services/productService';

interface ProductQuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { addToCart, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [fullProduct, setFullProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Fetch full product details when modal opens
  useEffect(() => {
    if (open && product.id) {
      setLoading(true);
      const fetchProduct = async () => {
        try {
          const result = await productService.getById(Number(product.id));
          setFullProduct(result);
          const defaultVariant =
            result.variants?.find((variant) => variant.isDefault) ?? result.variants?.[0] ?? null;
          setSelectedVariantId(defaultVariant ? defaultVariant.id : null);
        } catch (error) {
          console.error('Failed to load product details', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [open, product.id]);

  const selectedVariant = fullProduct?.variants?.find(
    (variant) => variant.id === selectedVariantId
  );

  // Get product images
  const images = useMemo(() => {
    if (!fullProduct) {
      return [product.image || getProductImageUrl(undefined)];
    }
    return resolveProductImageUrls(fullProduct as ApiProduct & Record<string, unknown>);
  }, [fullProduct, product.image]);

  const resolveVariantLabel = (variant: ProductVariant): string => {
    // Display "1kg" instead of "1000g" for better UX, but keep actual weight as 1000g for Aramex
    if (variant.weight && variant.weightUnit) {
      if (variant.weight === 1000 && variant.weightUnit.toLowerCase() === 'g') {
        return '1kg';
      }
      return `${variant.weight}${variant.weightUnit}`;
    }
    return `Option ${variant.id}`;
  };

  const resolvePrice = (): number => {
    if (selectedVariant) {
      const discount = selectedVariant.discountPrice;
      const regular = selectedVariant.price;
      if (discount && discount > 0) {
        return discount;
      }
      if (regular) {
        return regular;
      }
    }
    return product.price || 0;
  };

  const currentPrice = resolvePrice();
  const averageRating = fullProduct?.averageRating ?? 0;
  const totalReviews = fullProduct?.reviewCount ?? 0;

  const handleAddToCart = () => {
    const variantKey = selectedVariant ? `-${selectedVariant.id}` : '';
    const cartId = `${product.id}${variantKey}`;
    const variantLabel = selectedVariant ? resolveVariantLabel(selectedVariant) : '';
    const cartName = variantLabel ? `${product.name} - ${variantLabel}` : product.name;
    
    // Parse productId from string ID
    const productId = parseInt(product.id, 10);

  // Determine variant id to always include: prefer selectedVariant, then selectedVariantId, then first variant, else null
  const resolvedVariantId: number | null = (selectedVariant && selectedVariant.id) ?? (selectedVariantId ?? (fullProduct?.variants && fullProduct.variants.length > 0 ? fullProduct.variants[0].id : null));

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: cartId,
        productId: isNaN(productId) ? 0 : productId,
        productVariantId: resolvedVariantId ?? null,
        name: cartName,
        price: currentPrice,
        image: product.image,
        tastingNotes: product.tastingNotes,
        variantName: variantLabel || undefined,
      });
    }

    openCart();
    onOpenChange(false);
  };

  const handleViewFullDetails = () => {
    onOpenChange(false);
    // Small delay to ensure modal closes before navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate(`/products/${product.id}`);
    }, 100);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(10, prev + 1));
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onOpenChange(false);
  };

  const handleThumbnailClick = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
          </div>
        ) : (
          <div 
            className="flex flex-col md:grid md:grid-cols-2 gap-0 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Corner of Modal */}
            <button
              onClick={handleClose}
              type="button"
              className="sticky md:absolute top-2 ltr:right-2 rtl:left-2 bg-white hover:bg-gray-100 rounded-full p-1.5 shadow-lg z-20 transition-colors ltr:ml-auto rtl:mr-auto"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>

            {/* Product Image */}
            <div className="relative overflow-hidden bg-gray-50 p-2 md:p-3">
              <div 
                className="aspect-[4/3] md:aspect-square relative rounded-lg md:rounded-xl overflow-hidden cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
                    isZooming ? 'scale-150' : 'scale-100'
                  }`}
                  style={
                    isZooming
                      ? {
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }
                      : undefined
                  }
                  onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
                />
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="bg-white/95 p-2 border-t border-gray-200 -mx-2 -mb-2 mt-2 md:p-3 md:-mx-3 md:-mb-3 md:mt-3">
                  <div className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={handleThumbnailClick(index)}
                        className={`relative h-12 w-12 md:h-16 md:w-16 rounded-md md:rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-amber-500 ring-2 ring-amber-300 shadow-md'
                            : 'border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Product Details */}
            <div className="flex flex-col p-2 md:p-5 space-y-1.5 md:space-y-4">
              {/* Product Name and Reviews */}
              <div>
                <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">{product.name}</h2>
                
                {/* Reviews */}
                {averageRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-600">
                      ({averageRating.toFixed(1)}) · {totalReviews} {isArabic ? 'مراجعة' : 'reviews'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-400">(0.0) · 0 {isArabic ? 'مراجعة' : 'reviews'}</span>
                  </div>
                )}
              </div>

              {/* Coffee Information - Compact Grid on Mobile */}
              {fullProduct && (fullProduct.roastLevel || fullProduct.process || fullProduct.variety || fullProduct.altitude || fullProduct.farm || fullProduct.tastingNotes || fullProduct.notes || fullProduct.uses) && (
                <div className="space-y-1 md:space-y-1.5 text-[11px] md:text-xs">
                  {fullProduct.roastLevel && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'التحميص:' : 'Roast:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.roastLevelAr ? fullProduct.roastLevelAr : fullProduct.roastLevel}
                      </span>
                    </div>
                  )}
                  {fullProduct.process && (
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'المعالجة:' : 'Process:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.processAr ? fullProduct.processAr : fullProduct.process}
                      </span>
                    </div>
                  )}
                  {fullProduct.variety && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الصنف:' : 'Variety:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.varietyAr ? fullProduct.varietyAr : fullProduct.variety}
                      </span>
                    </div>
                  )}
                  {fullProduct.altitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الارتفاع:' : 'Altitude:'}</span>
                      <span className="font-semibold text-gray-900">
                        {fullProduct.altitude} {isArabic ? 'م' : 'masl'}
                      </span>
                    </div>
                  )}
                  {fullProduct.farm && (
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'المزرعة:' : 'Farm:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.farmAr ? fullProduct.farmAr : fullProduct.farm}
                      </span>
                    </div>
                  )}
                  {(fullProduct.notes || fullProduct.notesAr || fullProduct.tastingNotes || fullProduct.tastingNotesAr) && (
                    <div className="flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'ملاحظات التذوق:' : 'Notes:'}</span>
                      <span className="font-semibold text-gray-900 flex-1">
                        {isArabic 
                          ? (fullProduct.tastingNotesAr || fullProduct.notesAr || fullProduct.tastingNotes || fullProduct.notes)
                          : (fullProduct.tastingNotes || fullProduct.notes || fullProduct.tastingNotesAr || fullProduct.notesAr)}
                      </span>
                    </div>
                  )}
                  {(fullProduct.uses || fullProduct.usesAr) && (
                    <div className="flex items-start gap-2">
                      <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الاستخدامات:' : 'Uses:'}</span>
                      <span className="font-semibold text-gray-900 flex-1">
                        {isArabic && fullProduct.usesAr ? fullProduct.usesAr : fullProduct.uses}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price, Size and Quantity - Compact Unified Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-1.5 md:p-3 space-y-1 md:space-y-2">
                {/* Price - More compact on mobile */}
                <div className="flex items-baseline justify-between py-0.5 border-b border-amber-200/50 pb-1 md:pb-2">
                  <span className="text-[9px] md:text-xs text-gray-600 font-medium">{isArabic ? 'السعر' : 'Price'}</span>
                  <div className="flex items-center gap-1">
                    {selectedVariant?.discountPrice && selectedVariant.discountPrice < selectedVariant.price && (
                      <span className="text-[9px] md:text-xs text-gray-400 line-through">
                        {selectedVariant.price.toFixed(3)}
                      </span>
                    )}
                    <span className="text-base md:text-xl font-bold text-amber-900">
                      {currentPrice > 0
                        ? `${currentPrice.toFixed(3)} ${isArabic ? 'ر.ع' : 'OMR'}`
                        : isArabic
                          ? 'قريباً'
                          : 'Soon'}
                    </span>
                  </div>
                </div>

                {/* Size/Variant Selection - Optimized */}
                {fullProduct?.variants && fullProduct.variants.length > 0 && (
                  <div className="space-y-0.5 md:space-y-1 pt-0.5 md:pt-1">
                    <label className="text-[9px] md:text-[10px] font-bold text-gray-700 flex items-center gap-0.5 md:gap-1">
                      <Coffee className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-600" />
                      {isArabic ? 'اختر الحجم' : 'Choose Size'}
                    </label>
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                      {fullProduct.variants.map((variant) => {
                        const variantPrice = variant.discountPrice && variant.discountPrice > 0 
                          ? variant.discountPrice 
                          : variant.price;
                        const label = resolveVariantLabel(variant);
                        const isSelected = selectedVariant?.id === variant.id;
                        const hasDiscount = variant.discountPrice && variant.discountPrice > 0 && variant.discountPrice < variant.price;

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 flex-1 min-w-0 shadow-sm ${
                              isSelected
                                ? 'bg-[#6B4423] hover:bg-[#5a3a1e] text-white shadow-md scale-[1.02]'
                                : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 hover:border-amber-400 hover:shadow'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] md:text-xs font-semibold leading-tight">{label}</span>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {hasDiscount && (
                                  <span className={`text-[8px] md:text-[9px] line-through ${isSelected ? 'text-white/70' : 'text-amber-600/60'}`}>
                                    {variant.price.toFixed(3)}
                                  </span>
                                )}
                                <span className={`text-[9px] md:text-[10px] font-semibold ${isSelected ? 'text-white' : 'text-[#6B4423]'}`}>
                                  {variantPrice.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity - More compact */}
                <div className="flex items-center justify-between pt-1 md:pt-2">
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-700">
                    {isArabic ? 'الكمية' : 'Quantity'}
                  </span>
                  <div className="flex items-center border-2 border-amber-300 rounded bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="px-1.5 md:px-2.5 py-0.5 md:py-1 text-xs md:text-sm text-amber-900 hover:text-[#6B4423] hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      disabled={quantity <= 1}
                    >
                      –
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(Math.max(val, 1), 10));
                      }}
                      className="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold text-gray-900 w-10 md:w-12 text-center border-x border-amber-200 focus:outline-none focus:bg-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                      max="10"
                    />
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="px-1.5 md:px-2.5 py-0.5 md:py-1 text-xs md:text-sm text-amber-900 hover:text-[#6B4423] hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      disabled={quantity >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Optimized for mobile */}
              <div className="flex gap-1.5 md:gap-2 pt-0.5">
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={currentPrice <= 0}
                  className="flex-1 bg-[#6B4423] hover:bg-[#5a3a1e] text-white h-10 md:h-12 text-[11px] md:text-sm font-semibold flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 ltr:mr-1 rtl:ml-1 md:ltr:mr-1.5 md:rtl:ml-1.5" />
                  {isArabic ? 'إضافة للسلة' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={handleViewFullDetails}
                  variant="outline"
                  className="flex-1 border-2 border-[#6B4423] text-[#6B4423] hover:bg-amber-50 h-10 md:h-12 text-[11px] md:text-sm font-semibold flex items-center justify-center transition-all duration-200"
                >
                  {isArabic ? 'عرض التفاصيل' : 'Learn More'}
                </Button>
              </div>

              {/* Roasted Fresh in Oman Text */}
              <div className="text-center border-t border-amber-200/50 pt-1 md:pt-2">
                <p className="text-xs text-gray-400 italic">
                  {isArabic ? 'محمص طازج في عمان' : 'Roasted Fresh in Oman'}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
