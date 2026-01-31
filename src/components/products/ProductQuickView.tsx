import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, X, Coffee, Star, Loader2, Flame, RotateCw, BarChart3, MapPin, Wheat, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useCart } from '../../hooks/useCart';
import { useRegion } from '../../hooks/useRegion';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../lib/regionUtils';
import type { Product } from '../../contexts/AppContextDefinition';
import type { Product as ApiProduct, ProductReview, ProductReviewCreateDto, ProductVariant } from '../../types/product';
import { handleImageError, getProductImageUrl, resolveProductImageUrls } from '../../lib/imageUtils';
import { productService } from '../../services/productService';
import { productReviewService } from '../../services/productReviewService';
import { toast } from 'sonner';

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
  const { currentRegion } = useRegion();
  const { isAuthenticated, user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [fullProduct, setFullProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<ProductReviewCreateDto>({
    productId: 0,
    rating: 5,
    title: '',
    content: '',
    customerName: '',
    customerEmail: '',
  });

  // Fetch full product details when modal opens
  useEffect(() => {
    if (open && product.id) {
      setLoading(true);
      const fetchProduct = async () => {
        try {
          const result = await productService.getById(Number(product.id));
          const activeVariants = (result.variants ?? []).filter(
            (variant) => (variant as unknown as { isActive?: boolean }).isActive !== false,
          );
          const sanitized: ApiProduct = {
            ...result,
            variants: activeVariants,
          };

          setFullProduct(sanitized);
          const defaultVariant =
            activeVariants.find((variant) => variant.isDefault) ?? activeVariants[0] ?? null;
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

  useEffect(() => {
    if (!open) {
      setIsReviewsDialogOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!fullProduct) return;
    setReviewForm((prev) => ({
      ...prev,
      productId: fullProduct.id,
      rating: 5,
      title: '',
      content: '',
      customerName: isAuthenticated ? (user?.displayName || user?.username || '') : prev.customerName,
      customerEmail: isAuthenticated ? '' : prev.customerEmail,
    }));
    setIsReviewsDialogOpen(false);
    setCanReview(null);
  }, [fullProduct, isAuthenticated, user?.displayName, user?.username]);

  useEffect(() => {
    let cancelled = false;

    const checkCanReview = async () => {
      if (!fullProduct) return;

      // If user isn't authenticated, allow the form and let API enforce.
      if (!isAuthenticated) {
        setCanReview(true);
        return;
      }

      try {
        const allowed = await productReviewService.canReview(fullProduct.id);
        if (!cancelled) setCanReview(Boolean(allowed));
      } catch (err) {
        if (!cancelled) setCanReview(true);
      }
    };

    checkCanReview();
    return () => {
      cancelled = true;
    };
  }, [fullProduct, isAuthenticated]);

  const selectedVariant = fullProduct?.variants?.find(
    (variant) => variant.id === selectedVariantId
  );

  const isProductActive = (fullProduct as unknown as { isActive?: boolean } | null)?.isActive !== false;

  // Minimal guard: treat variant as out of stock when stockQuantity is 0 or less
  const isVariantOutOfStock = selectedVariant ? (selectedVariant.stockQuantity ?? 0) <= 0 : false;

  // Get product images
  const images = useMemo(() => {
    if (!fullProduct) {
      return [product.image || getProductImageUrl(undefined)];
    }
    return resolveProductImageUrls(fullProduct as ApiProduct & Record<string, unknown>);
  }, [fullProduct, product.image]);

  const isUfoDripProduct = (item?: ApiProduct | null): boolean => {
    const name = (item?.name || product.name || '').toLowerCase();
    const slug = (item?.slug || product.slug || '').toLowerCase();
    return name.includes('ufo drip') || slug.includes('ufo-drip');
  };

  const isCapsuleProduct = (item?: ApiProduct | null): boolean => {
    const name = (item?.name || product.name || '').toLowerCase();
    const slug = (item?.slug || product.slug || '').toLowerCase();
    const category = (item?.category?.name || '').toLowerCase();
    return name.includes('capsule') || slug.includes('capsule') || category.includes('capsule');
  };

  const resolveVariantLabel = (variant: ProductVariant): string => {
    if (isUfoDripProduct(fullProduct)) {
      return '7 PCS';
    }
    if (isCapsuleProduct(fullProduct)) {
      return isArabic ? '10 كبسولات' : '10 PCS';
    }
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
  const hideVariantPrice = isUfoDripProduct(fullProduct) || isCapsuleProduct(fullProduct);

  const approvedReviewStats = useMemo(() => {
    const reviews = (fullProduct?.reviews ?? []) as ProductReview[];
    if (reviews.length === 0) {
      return null;
    }

    const approved = reviews.filter((review) => review.isApproved);
    if (approved.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return {
      averageRating: sum / approved.length,
      totalReviews: approved.length,
    };
  }, [fullProduct?.reviews]);

  const averageRating = approvedReviewStats?.averageRating ?? fullProduct?.averageRating ?? 0;

  const handleAddToCart = () => {
    // Runtime guard: prevent adding an out-of-stock variant
    if (isVariantOutOfStock || !isProductActive) return;
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
        weight: selectedVariant?.weight,
        weightUnit: selectedVariant?.weightUnit,
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
      navigate(`/products/${product.slug || product.id}`);
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
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    e.currentTarget.style.setProperty('--zoom-origin', `${x}% ${y}%`);
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleOpenReviews = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!fullProduct) return;
    setIsReviewsDialogOpen(true);
  };

  const submitReview = async () => {
    if (!fullProduct) return;

    const rating = Number(reviewForm.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error(isArabic ? 'الرجاء اختيار تقييم من 1 إلى 5' : 'Please choose a rating from 1 to 5');
      return;
    }
    if (!reviewForm.content || reviewForm.content.trim().length < 10) {
      toast.error(isArabic ? 'اكتب مراجعة أطول (10 أحرف على الأقل)' : 'Please write a longer review (at least 10 characters)');
      return;
    }
    if (!isAuthenticated) {
      if (!reviewForm.customerName || reviewForm.customerName.trim().length < 2) {
        toast.error(isArabic ? 'الرجاء كتابة الاسم' : 'Please enter your name');
        return;
      }
    }

    try {
      setReviewSubmitting(true);
      await productReviewService.create({
        productId: fullProduct.id,
        rating,
        title: reviewForm.title?.trim() || undefined,
        content: reviewForm.content.trim(),
        customerName: isAuthenticated ? (user?.displayName || user?.username) : (reviewForm.customerName?.trim() || undefined),
        customerEmail: isAuthenticated ? undefined : (reviewForm.customerEmail?.trim() || undefined),
      });

      toast.success(
        isArabic
          ? 'شكراً لك! مراجعتك قيد المراجعة للموافقة.'
          : 'Thanks! Your review is pending approval.'
      );

      setReviewForm((prev) => ({
        ...prev,
        rating: 5,
        title: '',
        content: '',
        customerName: isAuthenticated ? (user?.displayName || user?.username || '') : prev.customerName,
        customerEmail: isAuthenticated ? '' : prev.customerEmail,
      }));

      setIsReviewsDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to submit review', err);
      toast.error(err?.response?.data?.message || err?.message || (isArabic ? 'تعذر إرسال المراجعة' : 'Failed to submit review'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-white shadow-2xl border border-gray-200/80" showCloseButton={false}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
            </div>
          ) : (
            <div 
              className="flex flex-col md:grid md:grid-cols-2 gap-0 relative bg-white md:divide-x divide-gray-200"
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
            <div className="relative overflow-hidden bg-white p-2 md:p-3">
              <div 
                className="aspect-[3/2] md:aspect-square relative rounded-lg md:rounded-xl overflow-hidden cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  width={400}
                  height={400}
                  fetchPriority="high"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
                    isZooming ? 'scale-150' : 'scale-100'
                  } zoom-origin-var`}
                  onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
                />
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="bg-white p-2 border-t border-gray-200 -mx-2 -mb-2 mt-2 md:p-3 md:-mx-3 md:-mb-3 md:mt-3">
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={handleThumbnailClick(index)}
                        className={`relative h-12 w-12 md:h-16 md:w-16 rounded-md md:rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-amber-500 ring-2 ring-amber-300 shadow-md'
                            : 'border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
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
            <div className="flex flex-col p-2 md:p-5 space-y-1.5 md:space-y-4 bg-white">
              {/* Product Name and Reviews */}
              <div>
                <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">{product.name}</h2>
                
                {/* Reviews */}
                {averageRating > 0 ? (
                  <button
                    type="button"
                    onClick={handleOpenReviews}
                    className="flex items-center gap-2 text-left hover:opacity-90"
                    aria-label={isArabic ? 'إضافة مراجعة' : 'Add review'}
                  >
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
                    <span className="text-[10px] md:text-xs text-gray-600 underline-offset-2 hover:underline">
                      ({averageRating.toFixed(1)})
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenReviews}
                    className="flex items-center gap-2 text-left hover:opacity-90"
                    aria-label={isArabic ? 'إضافة مراجعة' : 'Add review'}
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-400 underline-offset-2 hover:underline">(0.0)</span>
                  </button>
                )}
              </div>

              {/* Coffee Information - Compact Grid on Mobile */}
              {fullProduct && (fullProduct.roastLevel || fullProduct.process || fullProduct.variety || fullProduct.altitude || fullProduct.farm || fullProduct.tastingNotes || fullProduct.notes || fullProduct.uses) && (
                <div className="space-y-1 md:space-y-1.5 text-[11px] md:text-xs rounded-lg border border-gray-200 bg-white p-2 md:p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  {fullProduct.roastLevel && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'التحميص:' : 'Roast:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.roastLevelAr ? fullProduct.roastLevelAr : fullProduct.roastLevel}
                      </span>
                    </div>
                  )}
                  {fullProduct.process && (
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'المعالجة:' : 'Process:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.processAr ? fullProduct.processAr : fullProduct.process}
                      </span>
                    </div>
                  )}
                  {fullProduct.variety && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الصنف:' : 'Variety:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.varietyAr ? fullProduct.varietyAr : fullProduct.variety}
                      </span>
                    </div>
                  )}
                  {fullProduct.altitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الارتفاع:' : 'Altitude:'}</span>
                      <span className="font-semibold text-gray-900">
                        {fullProduct.altitude} {isArabic ? 'م' : 'masl'}
                      </span>
                    </div>
                  )}
                  {fullProduct.farm && (
                    <div className="flex items-center gap-2">
                      <Wheat className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'المزرعة:' : 'Farm:'}</span>
                      <span className="font-semibold text-gray-900">
                        {isArabic && fullProduct.farmAr ? fullProduct.farmAr : fullProduct.farm}
                      </span>
                    </div>
                  )}
                  {(fullProduct.notes || fullProduct.notesAr || fullProduct.tastingNotes || fullProduct.tastingNotesAr) && (
                    <div className="flex items-start gap-2">
                      <ClipboardList className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0 mt-0.5" />
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
                      <Coffee className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600/70 shrink-0 mt-0.5" />
                      <span className="text-gray-500 min-w-[60px] md:min-w-[70px]">{isArabic ? 'الاستخدامات:' : 'Uses:'}</span>
                      <span className="font-semibold text-gray-900 flex-1">
                        {isArabic && fullProduct.usesAr ? fullProduct.usesAr : fullProduct.uses}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price, Size and Quantity - Compact Unified Section */}
              <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-1.5 md:p-3 space-y-1 md:space-y-2">
                {/* Header: Select size + price */}
                <div className="flex items-center justify-between py-0.5 border-b border-amber-200/50 pb-1 md:pb-2">
                  <div className="flex items-center gap-1.5">
                    <Coffee className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-700/70" />
                    <div className="flex flex-col">
                      <span className="text-[11px] md:text-sm text-gray-700 font-semibold">
                        {isArabic ? 'اختر الحجم' : 'Choose Size'}
                      </span>
                      {fullProduct && isUfoDripProduct(fullProduct) ? (
                        <span className="text-[9px] md:text-[10px] text-emerald-700">
                          {isArabic
                            ? '♻️ علب يو إف أو دريب قابلة لإعادة التدوير'
                            : '♻️ UFO Drip Boxes – 100% recyclable'}
                        </span>
                      ) : fullProduct && isCapsuleProduct(fullProduct) ? (
                        <span className="text-[9px] md:text-[10px] text-emerald-700">
                          {isArabic
                            ? '♻️ كبسولات ألمنيوم قابلة لإعادة التدوير'
                            : '♻️ Aluminium capsules – 100% recyclable'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedVariant?.discountPrice && selectedVariant.discountPrice < selectedVariant.price && (
                      <span className="text-[9px] md:text-xs text-gray-400 line-through">
                        {selectedVariant.price.toFixed(3)}
                      </span>
                    )}
                    <span className="text-base md:text-xl font-bold text-amber-900">
                      {currentPrice > 0
                        ? formatPrice(currentPrice * quantity, currentRegion.code, isArabic)
                        : isArabic
                          ? 'قريباً'
                          : 'Soon'}
                    </span>
                  </div>
                </div>

                {/* Size/Variant Selection - Optimized */}
                {fullProduct?.variants && fullProduct.variants.length > 0 && (
                  <div className="space-y-0.5 md:space-y-1 pt-0.5 md:pt-1">
                    <label className="sr-only">{isArabic ? 'اختر الحجم' : 'Choose Size'}</label>
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                      {fullProduct.variants.map((variant) => {
                        const variantPrice = variant.discountPrice && variant.discountPrice > 0 
                          ? variant.discountPrice 
                          : variant.price;
                        const label = resolveVariantLabel(variant);
                        const isSelected = selectedVariant?.id === variant.id;
                        const hasDiscount = variant.discountPrice && variant.discountPrice > 0 && variant.discountPrice < variant.price;
                        const variantOutOfStock = (variant.stockQuantity ?? 0) <= 0;
                        const isUfoDrip = isUfoDripProduct(fullProduct);
                        const isCapsule = isCapsuleProduct(fullProduct);

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`rounded-lg flex-1 min-w-0 shadow-sm ${
                              isUfoDrip || isCapsule
                                ? 'px-2 md:px-3 py-1 md:py-1.5 bg-[#6B4423] text-white border border-[#6B4423] cursor-default'
                                : `px-2 md:px-3 py-1.5 md:py-2 transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[#6B4423] hover:bg-[#5a3a1e] text-white shadow-md scale-[1.02]'
                                      : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 hover:border-amber-400 hover:shadow'
                                  }`
                            } ${variantOutOfStock ? 'opacity-60' : ''}`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] md:text-xs font-semibold leading-tight">{label}</span>
                              {isUfoDrip ? (
                                <span className="text-[9px] md:text-[10px] text-white/80">
                                  {isArabic ? '(7 أكياس تقطير فردية)' : '(7 single-serve drip filters)'}
                                </span>
                              ) : isCapsule ? (
                                <span className="text-[9px] md:text-[10px] text-white/80">
                                  {isArabic ? '(10 كبسولات قهوة)' : '(10 coffee capsules)'}
                                </span>
                              ) : null}
                              {!hideVariantPrice && (
                                <div className="flex flex-col items-center mt-0.5">
                                  <div className="flex items-center gap-0.5">
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
                              )}
                              {variantOutOfStock && (
                                <span className="text-[9px] text-red-600 font-semibold mt-1">
                                  {isArabic ? 'نفد المخزون' : 'Out of Stock'}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity - More compact */}
                <div className="border-t border-amber-200/50 mt-0.5 pt-0.5 md:mt-1 md:pt-1 space-y-1 md:space-y-1.5">
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-700">
                    {isArabic ? 'الكمية' : 'Quantity'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center h-11 border-2 border-amber-300 rounded-lg bg-amber-100/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={decreaseQuantity}
                        className="h-11 w-10 md:w-11 text-base font-extrabold text-amber-900 hover:text-[#6B4423] hover:bg-amber-200/60 transition-transform duration-150 active:scale-95 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                        aria-label={isArabic ? 'تقليل الكمية' : 'Decrease quantity'}
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
                        className="h-11 w-10 md:w-12 text-sm md:text-base font-bold text-gray-900 text-center border-x border-amber-200 focus:outline-none focus:bg-amber-100/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                        max="10"
                        aria-label={isArabic ? 'الكمية' : 'Quantity'}
                      />
                      <button
                        type="button"
                        onClick={increaseQuantity}
                        className="h-11 w-10 md:w-11 text-base font-extrabold text-amber-900 hover:text-[#6B4423] hover:bg-amber-200/60 transition-transform duration-150 active:scale-95 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        disabled={quantity >= 10}
                        aria-label={isArabic ? 'زيادة الكمية' : 'Increase quantity'}
                      >
                        +
                      </button>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={currentPrice <= 0 || isVariantOutOfStock}
                      className="flex-1 h-11 bg-[#6B4423] hover:bg-[#5a3a1e] text-white text-[11px] md:text-sm font-semibold flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 ltr:mr-1 rtl:ml-1 md:ltr:mr-1.5 md:rtl:ml-1.5" />
                      {isArabic ? 'إضافة للسلة' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleViewFullDetails}
                  variant="outline"
                  className="w-full border-2 border-[#6B4423] text-[#6B4423] hover:bg-amber-50 h-9 md:h-11 text-[11px] md:text-sm font-semibold flex items-center justify-center transition-all duration-200"
                >
                  {isArabic ? 'عرض التفاصيل' : 'Coffee Details'}
                </Button>
              </div>

              {/* Roasted Fresh in Oman Text */}
              <div className="text-center border-t border-amber-200/50 pt-1 md:pt-2">
                <p className="text-xs text-gray-400 italic">
                  {isArabic ? 'محمص طازج أسبوعياً في عمان' : 'Roasted fresh weekly in Oman'}
                </p>
              </div>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewsDialogOpen} onOpenChange={setIsReviewsDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="bg-white">
            <div className="flex items-center gap-3 px-5 pt-5">
              <div className="flex-1">
                <DialogHeader>
                  <DialogTitle className="text-base">
                    {isArabic ? 'إرسال مراجعتك' : 'Send your review'}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? fullProduct?.nameAr ?? fullProduct?.name : fullProduct?.name}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5">
              {canReview === false ? (
                <div className="mt-4 text-sm text-gray-600">
                  {isArabic
                    ? 'لا يمكنك إضافة مراجعة لهذا المنتج حالياً.'
                    : "You can't review this product right now."}
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = (reviewForm.rating ?? 5) === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                          className={`rounded-xl border px-2 py-3 text-center transition ${
                            selected
                              ? 'bg-[#6B4423] text-white border-[#6B4423] shadow'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#6B4423]'
                          }`}
                          aria-label={isArabic ? `تقييم ${value}` : `Rate ${value}`}
                        >
                          <Star className={`mx-auto h-5 w-5 ${selected ? 'text-white' : 'text-gray-400'}`} />
                          <div className="mt-1 text-xs font-semibold">{value}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-semibold text-gray-800">
                      {reviewForm.rating ?? 5}
                    </div>
                    <div className="mx-auto mt-1 h-0.5 w-16 rounded bg-gray-200" />
                  </div>

                  {!isAuthenticated ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {isArabic ? 'الاسم' : 'Name'}
                        </label>
                        <Input
                          value={reviewForm.customerName ?? ''}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, customerName: e.target.value }))}
                          placeholder={isArabic ? 'اسمك' : 'Your name'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {isArabic ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                        </label>
                        <Input
                          value={reviewForm.customerEmail ?? ''}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                          placeholder={isArabic ? 'example@email.com' : 'example@email.com'}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Textarea
                      value={reviewForm.content ?? ''}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      placeholder={isArabic ? 'تعليق اختياري' : 'Optional comment'}
                      className="rounded-xl"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewSubmitting}
                    className="w-full rounded-full bg-[#6B4423] hover:bg-[#5a3a1e] text-white"
                  >
                    {reviewSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
                      </span>
                    ) : (
                      <>{isArabic ? 'إرسال المراجعة' : 'Submit review'}</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
