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
    const weightLabel =
      variant.weight && variant.weightUnit ? `${variant.weight}${variant.weightUnit}` : undefined;
    return weightLabel ?? `Option ${variant.id}`;
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

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: cartId,
        name: cartName,
        price: currentPrice,
        image: product.image,
        tastingNotes: product.tastingNotes,
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
              className="absolute top-3 ltr:right-3 rtl:left-3 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-20 transition-colors"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>

            {/* Product Name and Reviews - Mobile Only (Top) */}
            <div className="md:hidden px-5 pt-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h2>
              
              {/* Reviews */}
              {averageRating > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= averageRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    ({averageRating.toFixed(1)}) · {totalReviews} {isArabic ? 'مراجعة' : 'reviews'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5 text-gray-300" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">(0.0) · 0 {isArabic ? 'مراجعة' : 'reviews'}</span>
                </div>
              )}
            </div>

            {/* Product Image */}
            <div className="relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
                />
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="bg-white/95 p-3 border-t border-gray-200">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={handleThumbnailClick(index)}
                        className={`relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-amber-500 ring-2 ring-amber-300 shadow-md'
                            : 'border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(event) =>
                            handleImageError(event, '/images/products/default-product.webp')
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col p-5 space-y-4">
              {/* Product Name and Reviews - Desktop Only */}
              <div className="hidden md:block">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h2>
                
                {/* Reviews */}
                {averageRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({averageRating.toFixed(1)}) · {totalReviews} {isArabic ? 'مراجعة' : 'reviews'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">(0.0) · 0 {isArabic ? 'مراجعة' : 'reviews'}</span>
                  </div>
                )}
              </div>

              {/* Coffee Information */}
              {fullProduct && (fullProduct.roastLevel || fullProduct.process || fullProduct.variety || fullProduct.altitude || fullProduct.farm || fullProduct.notes || fullProduct.uses) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-gray-900">
                      {isArabic ? 'معلومات القهوة' : 'Coffee Information'}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {/* Grid layout for main properties */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {fullProduct.roastLevel && (
                        <div className="flex items-start gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-500 block text-[10px] leading-tight">
                              {isArabic ? 'مستوى التحميص' : 'Roast Level'}
                            </span>
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {isArabic && fullProduct.roastLevelAr ? fullProduct.roastLevelAr : fullProduct.roastLevel}
                            </span>
                          </div>
                        </div>
                      )}
                      {fullProduct.process && (
                        <div className="flex items-start gap-1.5">
                          <RotateCw className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-500 block text-[10px] leading-tight">
                              {isArabic ? 'المعالجة' : 'Process'}
                            </span>
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {isArabic && fullProduct.processAr ? fullProduct.processAr : fullProduct.process}
                            </span>
                          </div>
                        </div>
                      )}
                      {fullProduct.variety && (
                        <div className="flex items-start gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-500 block text-[10px] leading-tight">
                              {isArabic ? 'الصنف' : 'Variety'}
                            </span>
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {isArabic && fullProduct.varietyAr ? fullProduct.varietyAr : fullProduct.variety}
                            </span>
                          </div>
                        </div>
                      )}
                      {fullProduct.altitude && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-500 block text-[10px] leading-tight">
                              {isArabic ? 'الارتفاع' : 'Altitude'}
                            </span>
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {fullProduct.altitude} {isArabic ? 'م' : 'masl'}
                            </span>
                          </div>
                        </div>
                      )}
                      {fullProduct.farm && (
                        <div className="flex items-start gap-1.5 col-span-2">
                          <Wheat className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-500 block text-[10px] leading-tight">
                              {isArabic ? 'المزرعة' : 'Farm'}
                            </span>
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {isArabic && fullProduct.farmAr ? fullProduct.farmAr : fullProduct.farm}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes section - Below grid items, above uses */}
                    {(fullProduct.notes || fullProduct.notesAr || fullProduct.tastingNotes) && (
                      <div className="pt-2 border-t border-amber-200">
                        <div className="flex items-start gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 text-[10px] font-medium leading-tight block mb-0.5">
                              {isArabic ? 'الملاحظات:' : 'Notes:'}
                            </span>
                            <span className="text-xs font-semibold text-gray-900">
                              {isArabic && fullProduct.notesAr 
                                ? fullProduct.notesAr 
                                : fullProduct.notes || fullProduct.tastingNotes}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Uses section - highlighted */}
                    {(fullProduct.uses || fullProduct.usesAr) && (
                      <div className="bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5 mt-2">
                        <div className="flex items-start gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-rose-600 font-medium">
                              {isArabic ? 'الاستخدامات:' : 'Uses:'}
                            </span>
                            <span className="text-xs font-bold text-rose-900 ml-1">
                              {isArabic && fullProduct.usesAr ? fullProduct.usesAr : fullProduct.uses}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price and Size Selection */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">{isArabic ? 'السعر' : 'Price'}</span>
                  <div className="flex items-center gap-2">
                    {selectedVariant?.discountPrice && selectedVariant.discountPrice < selectedVariant.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {selectedVariant.price.toFixed(3)} {isArabic ? 'ر.ع' : 'OMR'}
                      </span>
                    )}
                    <span className="text-xl font-bold text-amber-700">
                      {currentPrice > 0
                        ? `${currentPrice.toFixed(3)} ${isArabic ? 'ر.ع' : 'OMR'}`
                        : isArabic
                          ? 'قريباً'
                          : 'Soon'}
                    </span>
                  </div>
                </div>

                {/* Size/Variant Selection */}
                {fullProduct?.variants && fullProduct.variants.length > 0 && (
                  <div className="space-y-3.5 pt-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
                      </svg>
                      {isArabic ? 'اختر الحجم' : 'Choose Size'}
                    </label>
                    <div className="flex flex-wrap gap-2.5">
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
                            className={`px-4 py-3 rounded-xl border-2 transition-all transform hover:scale-105 min-w-[110px] ${
                              isSelected
                                ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold">{label}</span>
                              <div className="flex items-center gap-1.5">
                                {hasDiscount && (
                                  <span className={`text-xs line-through ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                    {variant.price.toFixed(3)}
                                  </span>
                                )}
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                                  {variantPrice.toFixed(3)} {isArabic ? 'ر.ع' : 'OMR'}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {isArabic ? 'الكمية' : 'Quantity'}
                  </span>
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="px-3 py-1.5 text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      –
                    </button>
                    <span className="px-4 py-1.5 text-base font-semibold text-gray-800 min-w-[2.5rem] text-center border-x border-gray-300">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="px-3 py-1.5 text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      disabled={quantity >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={currentPrice <= 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-5 text-sm font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isArabic ? 'إضافة للسلة' : 'Add to Cart'}
                </Button>

                {/* View Full Details Button */}
                <Button
                  onClick={handleViewFullDetails}
                  variant="outline"
                  className="w-full border-2 border-amber-600 text-amber-600 hover:bg-amber-50 py-5 text-sm font-semibold"
                >
                  {isArabic ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
