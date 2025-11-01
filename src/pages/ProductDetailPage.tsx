import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
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
  const weightLabel =
    variant.weight && variant.weightUnit ? `${variant.weight} ${variant.weightUnit}` : undefined;
  const skuLabel = variant.variantSku;

  if (language === 'ar') {
    return weightLabel ?? skuLabel ?? `الخيار ${variant.id}`;
  }

  return skuLabel ?? weightLabel ?? `Option ${variant.id}`;
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

  const categoryLabel = useMemo(() => {
    if (!product) {
      return '';
    }

    const categoryName =
      language === 'ar'
        ? product.category?.nameAr ?? product.category?.name
        : product.category?.name ?? product.category?.nameAr;

    if (categoryName) {
      return categoryName;
    }

    const extras = product as unknown as { categoryName?: string; categoryNameAr?: string };
    if (language === 'ar') {
      return extras.categoryNameAr ?? extras.categoryName ?? '';
    }
    return extras.categoryName ?? extras.categoryNameAr ?? '';
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
  const tastingNotes = product?.tastingNotes ?? product?.notes ?? '';

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

  const handleVariantChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) {
      setSelectedVariantId(value);
    }
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
  const categoryText =
    language === 'ar' ? 'الفئة' : 'Category';
  const quantityLabel =
    language === 'ar' ? 'الكمية' : 'Quantity';
  const chooseOptionLabel =
    language === 'ar' ? 'اختر الخيار' : 'Choose an option';
  const reviewsLabel =
    language === 'ar' ? 'مراجعات' : 'reviews';

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${
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

      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
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
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700"
                      >
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
                      ) : null}
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayName}</h1>

                    {categoryLabel ? (
                      <div className="text-sm text-gray-500 mb-4">
                        <span className="font-semibold text-gray-700">{categoryText}:</span>{' '}
                        {categoryLabel}
                      </div>
                    ) : null}

                    {/* Short description or tasting notes */}
                    {tastingNotes ? (
                      <p className="text-gray-600 leading-relaxed mb-4">{tastingNotes}</p>
                    ) : null}
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-semibold">{priceLabel}</span>
                      <span className="text-3xl font-bold text-amber-700">
                        {price > 0
                          ? formatCurrency(price, language)
                          : language === 'ar'
                            ? 'السعر عند الطلب'
                            : 'Price on request'}
                      </span>
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="variant">
                          {chooseOptionLabel}
                        </label>
                        <select
                          id="variant"
                          onChange={handleVariantChange}
                          value={selectedVariant?.id ?? ''}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {product.variants.map((variant) => {
                            const variantPrice = resolvePrice(product, variant);
                            const label = resolveVariantLabel(variant, language);
                            return (
                              <option key={variant.id} value={variant.id}>
                                {label} —{' '}
                                {variantPrice > 0
                                  ? formatCurrency(variantPrice, language)
                                  : language === 'ar'
                                    ? 'السعر عند الطلب'
                                    : 'Price on request'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">{quantityLabel}</span>
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            type="button"
                            onClick={decreaseQuantity}
                            className="px-3 py-1 text-lg text-gray-600 hover:text-gray-800"
                            disabled={quantity <= 1}
                          >
                            –
                          </button>
                          <span className="px-4 py-1 text-lg font-semibold text-gray-800">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={increaseQuantity}
                            className="px-3 py-1 text-lg text-gray-600 hover:text-gray-800"
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
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {addToCartLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section for Description */}
              {displayDescription && (
                <div className="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden">
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
                    <div 
                      className="text-gray-600 leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_strong]:font-bold [&_em]:italic [&_a]:text-amber-600 [&_a]:underline [&_a:hover]:text-amber-700 [&_img]:rounded-lg [&_img]:my-4"
                      dangerouslySetInnerHTML={{ __html: displayDescription }}
                    />
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
