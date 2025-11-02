import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Loader2,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { productService } from '../services/productService';
import { getProductImageUrl, handleImageError, resolveProductImageUrls } from '../lib/imageUtils';
import type { Product as ApiProduct, ProductVariant } from '../types/product';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/button';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const resolveVariantLabel = (variant: ProductVariant, language: string): string => {
  // Display "1kg" instead of "1000g" for better UX, but keep actual weight as 1000g for Aramex
  let weightLabel: string | undefined;
  if (variant.weight && variant.weightUnit) {
    if (variant.weight === 1000 && variant.weightUnit.toLowerCase() === 'g') {
      weightLabel = '1kg';
    } else {
      weightLabel = `${variant.weight}${variant.weightUnit}`;
    }
  }
  
  const skuLabel = variant.variantSku;

  if (language === 'ar') {
    // Arabic: Show weight first, fallback to SKU if no weight
    return weightLabel ?? skuLabel ?? `الخيار ${variant.id}`;
  }

  // English: Show weight first, fallback to simple option name if no weight
  return weightLabel ?? `Option ${variant.id}`;
};

const resolvePrice = (product: ApiProduct, variant?: ProductVariant): number => {
  if (variant) {
    const discount = toNumber(variant.discountPrice);
    const regular = toNumber(variant.price);
    if (typeof discount === 'number' && discount > 0) {
      return discount;
    }
    if (typeof regular === 'number') {
      return regular;
    }
  }

  const extras = product as unknown as { price?: number; minPrice?: number; basePrice?: number };
  return extras.price ?? extras.minPrice ?? extras.basePrice ?? 0;
};

const formatCurrency = (value: number, language: string): string => {
  const formatter = new Intl.NumberFormat(language === 'ar' ? 'ar-OM' : 'en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return formatter.format(value);
};

export const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { language } = useApp();
  const cart = useCart();

  const [state, setState] = useState<LoadState>('idle');
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Scroll to top when component mounts or productId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      if (!productId) {
        setProduct(null);
        setState('error');
        setErrorMessage(
          language === 'ar' ? 'لم يتم العثور على هذا المنتج.' : 'We could not find that product.',
        );
        return;
      }

      setState('loading');
      setErrorMessage(null);

      try {
        const isNumeric = /^\d+$/.test(productId);
        const result = isNumeric
          ? await productService.getById(Number(productId))
          : await productService.getBySlug(productId);

        if (!isMounted) {
          return;
        }

        setProduct(result);
        const defaultVariant =
          result.variants?.find((variant) => variant.isDefault) ?? result.variants?.[0] ?? null;
        setSelectedVariantId(defaultVariant ? defaultVariant.id : null);
        setQuantity(1);
        setCurrentImageIndex(0);
        setState('ready');
      } catch (error) {
        console.error('Failed to load product details', error);
        if (!isMounted) {
          return;
        }

        setProduct(null);
        setState('error');
        setErrorMessage(
          language === 'ar'
            ? 'حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة لاحقاً.'
            : 'Something went wrong while loading this product. Please try again later.',
        );
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [language, productId]);

  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) {
      return undefined;
    }

    return product.variants.find((variant) => variant.id === selectedVariantId) ??
      product.variants.find((variant) => variant.isDefault) ??
      product.variants[0];
  }, [product, selectedVariantId]);

  const images = useMemo(() => {
    if (!product) {
      return [getProductImageUrl(undefined)];
    }

    return resolveProductImageUrls(product as ApiProduct & Record<string, unknown>);
  }, [product]);

  const displayName = useMemo(() => {
    if (!product) {
      return '';
    }

    return language === 'ar' && product.nameAr ? product.nameAr : product.name;
  }, [language, product]);

  const displayDescription = useMemo(() => {
    if (!product) {
      return '';
    }

    const description = language === 'ar' ? product.descriptionAr : product.description;
    return description ?? '';
  }, [language, product]);

  const price = useMemo(() => {
    if (!product) {
      return 0;
    }

    return resolvePrice(product, selectedVariant);
  }, [product, selectedVariant]);

  const isAvailable = product?.isActive ?? false;
  const averageRating = product?.averageRating ?? 0;
  const totalReviews = product?.reviewCount ?? 0;
  const tastingNotes = language === 'ar' 
    ? (product?.tastingNotesAr ?? product?.notesAr ?? '') 
    : (product?.tastingNotes ?? product?.notes ?? '');

  const incrementImage = (direction: 1 | -1) => {
    setCurrentImageIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) {
        return images.length - 1;
      }
      if (nextIndex >= images.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(10, prev + 1));
  };

  const handleAddToCart = () => {
    if (!product || price <= 0) {
      return;
    }

    const variantKey = selectedVariant ? `-${selectedVariant.id}` : '';
    const cartId = `${product.id}${variantKey}`;

    const variantLabel = selectedVariant ? resolveVariantLabel(selectedVariant, language) : '';
    const cartName = variantLabel ? `${displayName} - ${variantLabel}` : displayName;
    const image = images[0] ?? getProductImageUrl(undefined);

    cart.addToCart({
      id: cartId,
      name: cartName,
      price,
      image,
      tastingNotes,
    });

    if (quantity > 1) {
      cart.updateQuantity(cartId, quantity);
    }

    cart.openCart();
  };

  const addToCartLabel =
    language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart';
  const unavailableLabel =
    language === 'ar' ? 'غير متوفر حالياً' : 'Currently unavailable';
  const priceLabel =
    language === 'ar' ? 'السعر' : 'Price';
  const quantityLabel =
    language === 'ar' ? 'الكمية' : 'Quantity';
  const chooseOptionLabel =
    language === 'ar' ? 'اختر الخيار' : 'Choose an option';
  const reviewsLabel =
    language === 'ar' ? 'مراجعات' : 'reviews';
  const stockLabel =
    language === 'ar' ? 'متوفر في المخزون' : 'In Stock';

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-amber-600 transition-colors">
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-amber-600 transition-colors">
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </Link>
            {product ? (
              <Fragment>
                <span>/</span>
                <span className="text-amber-700 font-semibold">{displayName}</span>
              </Fragment>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            {/* Back Button */}
            {state === 'ready' && product && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  asChild
                  className="gap-2"
                >
                  <Link to="/products">
                    {language === 'ar' ? (
                      <>
                        الرجوع
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            )}

            {state === 'loading' ? (
              <div className="flex justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-gray-600">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                  <span>{language === 'ar' ? 'جاري تحميل المنتج...' : 'Loading product...'}</span>
                </div>
              </div>
            ) : null}

            {state === 'error' ? (
              <div className="text-center py-16">
                <div className="flex flex-col gap-4 items-center">
                  <Coffee className="w-16 h-16 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-700">
                    {errorMessage ??
                      (language === 'ar'
                        ? 'حدث خطأ غير متوقع.'
                        : 'An unexpected error occurred.')}
                  </h3>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                  >
                    {language === 'ar' ? 'العودة إلى المنتجات' : 'Back to products'}
                  </Link>
                </div>
              </div>
            ) : null}

            {state === 'ready' && product ? (
              <>
                {/* Product Details Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-8">
                    {/* Mobile Product Name & Rating - Show above image on mobile */}
                    <div className="lg:hidden mb-6">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">{displayName}</h1>
                      <div className="flex items-center gap-3">
                        {averageRating > 0 ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span>{averageRating.toFixed(1)}</span>
                            {totalReviews > 0 ? (
                              <span className="text-gray-400">
                                ({totalReviews} {reviewsLabel})
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 text-gray-300" />
                              ))}
                            </div>
                            <span>(0.0) · 0 {reviewsLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="relative bg-gradient-to-br from-amber-200 to-orange-300 rounded-2xl overflow-hidden aspect-square">
                    <img
                      src={images[currentImageIndex]}
                      alt={displayName}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) =>
                        handleImageError(event, '/images/products/default-product.webp')
                      }
                    />

                    {product.isFeatured ? (
                      <div className="absolute top-4 ltr:left-4 rtl:right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-md">
                        {language === 'ar' ? 'مميز' : 'Featured'}
                      </div>
                    ) : null}

                    {!isAvailable ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                          {unavailableLabel}
                        </span>
                      </div>
                    ) : null}

                    {images.length > 1 ? (
                      <div className="absolute inset-x-0 top-1/2 flex justify-between px-4 text-white">
                        <button
                          type="button"
                          onClick={() => incrementImage(-1)}
                          className="rounded-full bg-black/40 p-2 hover:bg-black/60 transition-colors"
                          aria-label={language === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => incrementImage(1)}
                          className="rounded-full bg-black/40 p-2 hover:bg-black/60 transition-colors"
                          aria-label={language === 'ar' ? 'الصورة التالية' : 'Next image'}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {images.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 ${
                            currentImageIndex === index
                              ? 'border-amber-500'
                              : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${displayName} thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(event) =>
                              handleImageError(event, '/images/products/default-product.webp')
                            }
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Product Information */}
                <div className="space-y-6">
                  {/* Desktop Product Name & Rating - Hidden on mobile */}
                  <div className="hidden lg:block">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayName}</h1>

                    <div className="flex items-center gap-3 mb-6">
                      {averageRating > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{averageRating.toFixed(1)}</span>
                          {totalReviews > 0 ? (
                            <span className="text-gray-400">
                              ({totalReviews} {reviewsLabel})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-4 h-4 text-gray-300" />
                            ))}
                          </div>
                          <span>(0.0) · 0 {reviewsLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coffee Information Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Coffee className="w-4 h-4 text-amber-700" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {language === 'ar' ? 'معلومات القهوة' : 'Coffee Information'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {/* Roast Level */}
                      {(language === 'ar' ? product.roastLevelAr : product.roastLevel) ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                          </svg>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'مستوى التحميص' : 'Roast Level'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {language === 'ar' ? product.roastLevelAr : product.roastLevel}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Process */}
                      {(language === 'ar' ? product.processAr : product.process) ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'المعالجة' : 'Process'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {language === 'ar' ? product.processAr : product.process}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Variety */}
                      {(language === 'ar' ? product.varietyAr : product.variety) ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                          </svg>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'الصنف' : 'Variety'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {language === 'ar' ? product.varietyAr : product.variety}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Altitude */}
                      {product.altitude ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'الارتفاع' : 'Altitude'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {product.altitude} {language === 'ar' ? 'م' : 'masl'}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Farm */}
                      {(language === 'ar' ? product.farmAr : product.farm) ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'المزرعة' : 'Farm'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {language === 'ar' ? product.farmAr : product.farm}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Notes / Tasting Notes - Full Width */}
                    {((language === 'ar' ? product.notesAr : product.notes) || tastingNotes) ? (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-500 inline-block mr-1.5">
                              {language === 'ar' ? 'الملاحظات:' : 'Notes:'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 inline-block" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              {(language === 'ar' ? product.notesAr : product.notes) || tastingNotes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Uses - Highlighted */}
                    {(language === 'ar' ? product.usesAr : product.uses) ? (
                      <div className="mt-3">
                        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span className="text-xs text-rose-600 font-medium">
                              {language === 'ar' ? 'الاستخدامات:' : 'Uses:'}
                            </span>
                            <span className="text-sm font-bold text-rose-900">
                              {language === 'ar' ? product.usesAr : product.uses}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                    {/* Price and Stock Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">{priceLabel}</span>
                        <span className="text-2xl font-bold text-amber-700">
                          {price > 0
                            ? formatCurrency(price, language)
                            : language === 'ar'
                              ? 'السعر عند الطلب'
                              : 'Price on request'}
                        </span>
                      </div>
                      {/* Stock Status */}
                      {isAvailable && (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold">{stockLabel}</span>
                        </div>
                      )}
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
                          </svg>
                          {chooseOptionLabel}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {product.variants.map((variant) => {
                            const variantPrice = resolvePrice(product, variant);
                            const label = resolveVariantLabel(variant, language);
                            const isSelected = selectedVariant?.id === variant.id;
                            
                            // Show original price if there's a discount
                            const hasDiscount = variant.discountPrice && variant.discountPrice > 0 && variant.price && variant.discountPrice < variant.price;
                            
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => setSelectedVariantId(variant.id)}
                                className={`px-5 py-3.5 rounded-xl border-2 transition-all transform hover:scale-105 min-w-[120px] ${
                                  isSelected
                                    ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-bold">{label}</span>
                                  <div className="flex items-center gap-2">
                                    {hasDiscount && (
                                      <span className={`text-xs line-through ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                        {formatCurrency(variant.price!, language)}
                                      </span>
                                    )}
                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                                      {variantPrice > 0
                                        ? formatCurrency(variantPrice, language)
                                        : language === 'ar'
                                          ? 'السعر عند الطلب'
                                          : 'Price on request'}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">{quantityLabel}</span>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={decreaseQuantity}
                            className="px-2.5 py-1 text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            disabled={quantity <= 1}
                          >
                            –
                          </button>
                          <span className="px-3 py-1 text-base font-semibold text-gray-800 min-w-[2rem] text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={increaseQuantity}
                            className="px-2.5 py-1 text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            disabled={quantity >= 10}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isAvailable || price <= 0}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 flex-1"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {addToCartLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* Tabs Section for Description */}
              {displayDescription && (
                <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="border-b border-gray-200">
                    <div className="container mx-auto">
                      <div className="flex">
                        <button
                          type="button"
                          className="px-8 py-4 text-lg font-semibold text-gray-700 border-b-4 border-amber-600 bg-amber-50"
                        >
                          {language === 'ar' ? 'الوصف' : 'Description'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="relative">
                      <div 
                        className={`text-gray-600 leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_strong]:font-bold [&_em]:italic [&_a]:text-amber-600 [&_a]:underline [&_a:hover]:text-amber-700 [&_img]:rounded-lg [&_img]:my-4 transition-all duration-300 ${
                          !isDescriptionExpanded ? 'line-clamp-5' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: displayDescription }}
                      />
                      {!isDescriptionExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-4 text-amber-600 hover:text-amber-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      {isDescriptionExpanded
                        ? (language === 'ar' ? 'عرض أقل' : 'Read Less')
                        : (language === 'ar' ? 'قراءة المزيد' : 'Read More')}
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isDescriptionExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
