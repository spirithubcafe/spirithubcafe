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
  Flame,
  RotateCw,
  BarChart3,
  MapPin,
  Wheat,
  ClipboardList,
  Scale,
  Thermometer,
  Scissors,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { productService } from '../services/productService';
import { getProductImageUrl, handleImageError, resolveProductImageUrls } from '../lib/imageUtils';
import { generateProductSeoMetadata } from '../lib/productSeoUtils';
import type { Product as ApiProduct, ProductVariant } from '../types/product';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/button';
import { Seo } from '../components/seo/Seo';
import { siteMetadata, resolveAbsoluteUrl } from '../config/siteMetadata';
import { ProductShare } from '../components/products/ProductShare';

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
  const { currentRegion } = useRegion();
  const cart = useCart();

  const [state, setState] = useState<LoadState>('idle');
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'brewing'>('description');

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

        if ((result as unknown as { isActive?: boolean }).isActive === false) {
          setProduct(null);
          setState('error');
          setErrorMessage(
            language === 'ar' ? 'لم يتم العثور على هذا المنتج.' : 'We could not find that product.',
          );
          return;
        }

        const activeVariants = (result.variants ?? []).filter(
          (variant) => (variant as unknown as { isActive?: boolean }).isActive !== false,
        );
        const sanitized: ApiProduct = {
          ...result,
          variants: activeVariants,
        };

        setProduct(sanitized);
        const defaultVariant =
          activeVariants.find((variant) => variant.isDefault) ?? activeVariants[0] ?? null;
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
  }, [language, productId, currentRegion.code]);

  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) {
      return undefined;
    }

    return product.variants.find((variant) => variant.id === selectedVariantId) ??
      product.variants.find((variant) => variant.isDefault) ??
      product.variants[0];
  }, [product, selectedVariantId]);

  // Minimal guard: treat variant as out of stock when stockQuantity is 0 or less
  const isVariantOutOfStock = selectedVariant ? (selectedVariant.stockQuantity ?? 0) <= 0 : false;

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

  const plainDescription = useMemo(() => {
    if (!displayDescription) {
      return '';
    }
    return displayDescription.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }, [displayDescription]);

  // Helper function to get image alt text with fallback
  const getImageAlt = (index: number): string => {
    const image = product?.images?.[index];
    if (image) {
      const customAlt = language === 'ar' ? image.altTextAr : image.altText;
      if (customAlt) {
        return customAlt;
      }
    }
    // Fallback: use main imageAlt field or product name
    const mainAlt = language === 'ar' ? product?.imageAltAr : product?.imageAlt;
    return mainAlt || `${displayName} - ${language === 'ar' ? 'صورة' : 'Image'} ${index + 1}`;
  };

  const canonicalUrl = useMemo(() => {
    if (!product) {
      return `${siteMetadata.baseUrl}/products`;
    }
    const slugOrId = (product.slug && product.slug.trim()) || String(product.id);
    return `${siteMetadata.baseUrl}/products/${slugOrId}`;
  }, [product]);

  // Use custom metaTitle if available, otherwise fallback to product name
  const seoTitle = product?.metaTitle || (product ? displayName : language === 'ar' ? 'تفاصيل المنتج' : 'Product details');

  const seoDescription = useMemo(() => {
    // Priority 1: Use custom metaDescription if available
    if (product?.metaDescription) {
      return product.metaDescription;
    }

    // Priority 2: Use plain description from product
    if (plainDescription) {
      return plainDescription;
    }

    // Priority 3: Auto-generate description
    if (product) {
      const categoryName = product.category?.name || '';
      const priceText = price > 0 ? ` - ${price.toFixed(3)} OMR` : '';
      
      return language === 'ar'
        ? `اشتري ${displayName} من سبيريت هب كافيه${priceText}. ${categoryName ? categoryName + ' - ' : ''}قهوة مختصة محمصة طازجة في مسقط، عمان. توصيل سريع، جودة مضمونة. ${plainDescription ? plainDescription.substring(0, 100) : ''}`
        : `Buy ${displayName} from Spirit Hub Cafe${priceText}. ${categoryName ? categoryName + ' - ' : ''}Fresh roasted specialty coffee in Muscat, Oman. Fast delivery, guaranteed quality. ${plainDescription ? plainDescription.substring(0, 100) : ''}`;
    }

    return language === 'ar'
      ? 'قهوة مختصة محمصة طازجة من سبيريت هب كافيه في مسقط، عمان.'
      : 'Fresh roasted specialty coffee from Spirit Hub Cafe in Muscat, Oman.';
  }, [displayName, language, plainDescription, product, price]);

  const structuredData = useMemo(() => {
    if (!product) {
      return null;
    }

    const imageList = images
      .map((img) => resolveAbsoluteUrl(img))
      .filter((src): src is string => Boolean(src));

    const offerPrice = price > 0 ? price.toFixed(3) : undefined;
    const aggregate =
      product.reviewCount && product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating ?? 0,
            reviewCount: product.reviewCount,
          }
        : undefined;

    // Breadcrumb structured data
    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'ar' ? 'الرئيسية' : 'Home',
          item: `${siteMetadata.baseUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'ar' ? 'المنتجات' : 'Products',
          item: `${siteMetadata.baseUrl}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: displayName,
          item: canonicalUrl,
        },
      ],
    };

    // Product structured data
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: displayName,
      description: seoDescription,
      sku: product.sku,
      image: imageList,
      brand: {
        '@type': 'Brand',
        name: siteMetadata.siteName,
      },
      offers: offerPrice
        ? {
            '@type': 'Offer',
            priceCurrency: 'OMR',
            price: offerPrice,
            availability: product.isActive
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: canonicalUrl,
            seller: {
              '@type': 'Organization',
              name: siteMetadata.siteName,
            },
          }
        : undefined,
      aggregateRating: aggregate,
      category: product.category?.name,
    };

    // Return both schemas as array
    return [breadcrumbList, productSchema];
  }, [canonicalUrl, displayName, images, price, product, seoDescription, language]);

  const isAvailable = product?.isActive ?? false;
  // Top badge: consider selected variant stock (if variant exists), otherwise fall back to product availability
  const topInStock = (() => {
    if (!product) return false;
    if (selectedVariant) {
      return (selectedVariant.stockQuantity ?? 0) > 0 && product.isActive;
    }
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v) => (v.stockQuantity ?? 0) > 0) && product.isActive;
    }
    return product.isActive;
  })();
  const averageRating = product?.averageRating ?? 0;
  const totalReviews = product?.reviewCount ?? 0;
  const tastingNotes = language === 'ar' 
    ? (product?.tastingNotesAr ?? product?.notesAr ?? '') 
    : (product?.tastingNotes ?? product?.notes ?? '');

  const displayNotes = useMemo(() => {
    const notes = (language === 'ar' ? product?.notesAr : product?.notes) || tastingNotes;
    if (!notes) return '';
    
    // Remove HTML tags and check if there's actual content
    const textContent = notes.replace(/<[^>]+>/g, '').trim();
    return textContent ? notes : '';
  }, [language, product, tastingNotes]);

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

  const handleAddToCart = () => {
    // Runtime guard: prevent adding an out-of-stock variant
    if (isVariantOutOfStock) return;

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
      productId: product.id,
      // Always include a variant id: prefer selected variant, fall back to first variant, otherwise null
      productVariantId: selectedVariant?.id ?? (product.variants && product.variants.length > 0 ? product.variants[0].id : null),
      name: cartName,
      price,
      image,
      tastingNotes,
      variantName: variantLabel || undefined,
      weight: selectedVariant?.weight,
      weightUnit: selectedVariant?.weightUnit,
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

  const seoMeta = useMemo(() => 
    product ? generateProductSeoMetadata(product, language as 'en' | 'ar') : null,
    [product, language]
  );

  return (
    <div
      className={`min-h-screen bg-gray-50 page-padding-top ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      <Seo
        title={seoTitle}
        description={seoDescription}
        image={images[0]}
        ogDescription={seoMeta?.ogDescription}
        keywords={
          product?.metaKeywords 
            ? product.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
            : [
                displayName,
                product?.category?.name || '',
                'Spirit Hub Cafe',
                'specialty coffee Oman',
              ].filter(Boolean)
        }
        canonical={canonicalUrl}
        structuredData={structuredData ?? undefined}
        type="product"
      />
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
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
      <div className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            {/* Back Button & Share Button */}
            {state === 'ready' && product && (
              <div className="mb-3 md:mb-4 flex items-center justify-between gap-3">
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

                <ProductShare
                  productName={displayName}
                  productUrl={canonicalUrl}
                  productDescription={seoMeta?.ogDescription || plainDescription}
                  tastingNotes={seoMeta?.simpleTastingNotes}
                  language={language}
                />
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
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-3 md:p-4 lg:p-6">
                    <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                      {/* Mobile: Product Name & Stock - Show above image */}
                      <div className="lg:hidden mb-3">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{displayName}</h2>
                        
                        <div className="flex items-center gap-2 md:gap-3">
                          {topInStock ? (
                            <div className="inline-flex items-center gap-1 md:gap-1.5 text-green-600 bg-green-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ml-auto">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-[9px] md:text-[10px] font-semibold">{stockLabel}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 md:gap-1.5 text-red-700 bg-red-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ml-auto">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span className="text-[9px] md:text-[10px] font-semibold">{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Gallery */}
                      <div className="space-y-2 md:space-y-3">
                        <div 
                          className="relative bg-linear-to-br from-amber-50 to-orange-100 rounded-xl overflow-hidden aspect-square w-full cursor-zoom-in"
                          onMouseMove={handleMouseMove}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <img
                            src={images[currentImageIndex]}
                            alt={getImageAlt(currentImageIndex)}
                            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-200 ${
                              isZooming ? 'scale-150' : 'scale-100'
                            } zoom-origin-var`}
                            onError={(event) =>
                              handleImageError(event, '/images/products/default-product.webp')
                            }
                          />

                          {product.isFeatured ? (
                            <div className="absolute top-3 ltr:left-3 rtl:right-3 bg-linear-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                              {language === 'ar' ? 'مميز' : 'Featured'}
                            </div>
                          ) : null}

                          {!isAvailable ? (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                                {unavailableLabel}
                              </span>
                            </div>
                          ) : null}

                          {images.length > 1 ? (
                            <div className="absolute inset-x-0 top-1/2 flex justify-between px-3 text-white">
                              <button
                                type="button"
                                onClick={() => incrementImage(-1)}
                                className="rounded-full bg-black/40 p-1.5 hover:bg-black/60 transition-colors"
                                aria-label={language === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => incrementImage(1)}
                                className="rounded-full bg-black/40 p-1.5 hover:bg-black/60 transition-colors"
                                aria-label={language === 'ar' ? 'الصورة التالية' : 'Next image'}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {images.length > 1 ? (
                          <div className="flex flex-wrap gap-2 justify-start">
                            {images.map((image, index) => (
                              <button
                                key={image}
                                type="button"
                                onClick={() => setCurrentImageIndex(index)}
                                className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                                  currentImageIndex === index
                                    ? 'border-amber-500 ring-2 ring-amber-300'
                                    : 'border-transparent hover:border-amber-300'
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={getImageAlt(index)}
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
                      <div className="space-y-3 md:space-y-4">
                        {/* Product Name - Desktop only */}
                        <div className="hidden lg:block">
                          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                          
                          {topInStock ? (
                            <div className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-[10px] font-semibold">{stockLabel}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span className="text-[10px] font-semibold">{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
                            </div>
                          )}
                        </div>

                        {/* Coffee Information - Compact List */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2.5 md:p-3 space-y-1.5 md:space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Coffee className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-700" />
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-900">
                              {language === 'ar' ? 'معلومات القهوة' : 'Coffee Information'}
                            </h3>
                          </div>

                          <div className="space-y-1 md:space-y-1.5 text-[10px] md:text-xs">{/* Roast Level */}
                            {(language === 'ar' ? product.roastLevelAr : product.roastLevel) ? (
                              <div className="flex items-center gap-2">
                                <Flame className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'التحميص:' : 'Roast:'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {language === 'ar' ? product.roastLevelAr : product.roastLevel}
                                </span>
                              </div>
                            ) : null}

                            {/* Process */}
                            {(language === 'ar' ? product.processAr : product.process) ? (
                              <div className="flex items-center gap-2">
                                <RotateCw className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'المعالجة:' : 'Process:'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {language === 'ar' ? product.processAr : product.process}
                                </span>
                              </div>
                            ) : null}

                            {/* Variety */}
                            {(language === 'ar' ? product.varietyAr : product.variety) ? (
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'الصنف:' : 'Variety:'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {language === 'ar' ? product.varietyAr : product.variety}
                                </span>
                              </div>
                            ) : null}

                            {/* Altitude */}
                            {product.altitude ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'الارتفاع:' : 'Altitude:'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {product.altitude} {language === 'ar' ? 'م' : 'masl'}
                                </span>
                              </div>
                            ) : null}

                            {/* Farm */}
                            {(language === 'ar' ? product.farmAr : product.farm) ? (
                              <div className="flex items-center gap-2">
                                <Wheat className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'المزرعة:' : 'Farm:'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {language === 'ar' ? product.farmAr : product.farm}
                                </span>
                              </div>
                            ) : null}

                            {/* Notes */}
                            {displayNotes ? (
                              <div className="flex items-start gap-2">
                                <ClipboardList className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-gray-600 min-w-[60px] md:min-w-[70px]">
                                  {language === 'ar' ? 'النكهات:' : 'Notes:'}
                                </span>
                                <span className="font-semibold text-gray-900 flex-1">
                                  {displayNotes}
                                </span>
                              </div>
                            ) : null}

                            {/* Uses - Highlighted */}
                            {(language === 'ar' ? product.usesAr : product.uses) ? (
                              <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-amber-200">
                                <div className="bg-rose-50 border border-rose-200 rounded-md px-2 md:px-2.5 py-1 md:py-1.5">
                                  <div className="flex items-center gap-2">
                                    <Coffee className="w-3 md:w-3.5 h-3 md:h-3.5 text-rose-600 shrink-0" />
                                    <span className="text-rose-700 font-medium text-[9px] md:text-[10px]">
                                      {language === 'ar' ? 'الاستخدامات:' : 'Best For:'}
                                    </span>
                                    <span className="font-bold text-rose-900 text-[10px] md:text-xs">
                                      {language === 'ar' ? product.usesAr : product.uses}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Price, Variants, and Cart Section */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 md:p-4 space-y-2 md:space-y-3 mt-3 md:mt-4">
                          {/* Price */}
                          <div className="flex items-baseline justify-between py-0.5 md:py-1 border-b border-amber-200/50 pb-1.5 md:pb-2">
                            <span className="text-[10px] md:text-xs text-gray-600 font-medium">{priceLabel}</span>
                            <span className="text-xl md:text-2xl font-bold text-amber-900">
                              {price > 0
                                ? formatCurrency(price, language)
                                : language === 'ar'
                                  ? 'السعر عند الطلب'
                                  : 'Price on request'}
                            </span>
                          </div>

                          {/* Variant Selection */}
                          {product.variants && product.variants.length > 0 ? (
                            <div className="space-y-1.5 md:space-y-2 pt-0.5 md:pt-1">
                              <label className="text-[10px] md:text-xs font-bold text-gray-900 flex items-center gap-1 md:gap-1.5">
                                <Coffee className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600" />
                                {chooseOptionLabel}
                              </label>
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {product.variants.map((variant) => {
                                  const variantPrice = resolvePrice(product, variant);
                                  const label = resolveVariantLabel(variant, language);
                                  const isSelected = selectedVariant?.id === variant.id;
                                  const hasDiscount = variant.discountPrice && variant.discountPrice > 0 && variant.price && variant.discountPrice < variant.price;
                                  const variantOutOfStock = (variant.stockQuantity ?? 0) <= 0;
                                  
                                  return (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      onClick={() => setSelectedVariantId(variant.id)}
                                      className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-all duration-200 font-semibold min-w-[100px] md:min-w-[110px] text-xs md:text-sm ${
                                        isSelected
                                          ? 'bg-[#6B4423] hover:bg-[#5a3a1e] text-white shadow-md scale-105'
                                          : 'bg-white text-amber-900 hover:bg-amber-50 border-2 border-amber-300 hover:border-[#6B4423] hover:shadow-sm'
                                      } ${variantOutOfStock ? 'opacity-60' : ''}`}
                                    >
                                      <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <span className="text-xs md:text-sm font-bold">{label}</span>
                                        <div className="flex flex-col items-center">
                                          <div className="flex items-center gap-1.5">
                                            {hasDiscount && (
                                              <span className={`text-[10px] line-through ${isSelected ? 'text-white/70' : 'text-amber-600/70'}`}>
                                                {formatCurrency(variant.price!, language)}
                                              </span>
                                            )}
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#6B4423]'}`}>
                                              {variantPrice > 0
                                                ? formatCurrency(variantPrice, language)
                                                : language === 'ar'
                                                  ? 'السعر عند الطلب'
                                                  : 'Price on request'}
                                            </span>
                                          </div>
                                          {variantOutOfStock && (
                                            <span className="text-[10px] text-red-600 font-semibold mt-1">
                                              {language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {/* Quantity and Add to Cart */}
                          <div className="flex items-center gap-1.5 md:gap-2 pt-1 md:pt-2">
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <span className="text-[10px] md:text-xs font-semibold text-gray-700">{quantityLabel}</span>
                              <div className="flex items-center border-2 border-amber-300 rounded-lg bg-white overflow-hidden">
                                <button
                                  type="button"
                                  onClick={decreaseQuantity}
                                  className="px-2 md:px-2.5 py-1 md:py-1.5 text-sm md:text-base text-amber-900 hover:text-[#6B4423] hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
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
                                  className="px-2.5 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-bold text-gray-900 w-12 md:w-14 text-center border-x border-amber-200 focus:outline-none focus:bg-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="1"
                                  max="10"
                                  aria-label={language === 'ar' ? 'الكمية' : 'Quantity'}
                                />
                                <button
                                  type="button"
                                  onClick={increaseQuantity}
                                  className="px-2 md:px-2.5 py-1 md:py-1.5 text-sm md:text-base text-amber-900 hover:text-[#6B4423] hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                  disabled={quantity >= 10}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <Button
                              type="button"
                              onClick={handleAddToCart}
                              disabled={!isAvailable || price <= 0 || isVariantOutOfStock}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 md:gap-2 bg-[#6B4423] hover:bg-[#5a3a1e] text-white font-semibold text-xs md:text-sm h-9 md:h-10 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <ShoppingCart className="w-3.5 md:w-4 h-3.5 md:h-4" />
                              {addToCartLabel}
                            </Button>
                          </div>

                          {/* Roasted Fresh in Oman */}
                          <div className="text-center pt-0.5 md:pt-1 border-t border-amber-200/50">
                            <p className="text-[10px] md:text-xs text-gray-500 italic">
                              {language === 'ar' ? 'محمص طازج في عمان' : 'Roasted Fresh in Oman'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Tabs Section for Description */}
              {displayDescription && (
                <div className="mt-4 md:mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="border-b border-gray-200">
                    <div className="container mx-auto">
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => setActiveTab('description')}
                          className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors ${
                            activeTab === 'description'
                              ? 'text-gray-700 border-b-2 border-amber-600 bg-amber-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? 'الوصف' : 'Description'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('brewing')}
                          className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors ${
                            activeTab === 'brewing'
                              ? 'text-gray-700 border-b-2 border-amber-600 bg-amber-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? 'دليل التحضير' : 'Brewing Guide'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    {activeTab === 'description' ? (
                      <>
                        <div className="relative">
                          <div 
                            className={`text-xs md:text-sm text-gray-600 leading-relaxed [&_p]:mb-2 md:[&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2 md:[&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2 md:[&_ol]:mb-3 [&_li]:mb-1 md:[&_li]:mb-1.5 [&_h1]:text-lg md:[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 md:[&_h1]:mb-3 [&_h2]:text-base md:[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1.5 md:[&_h2]:mb-2 [&_h3]:text-sm md:[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1.5 md:[&_h3]:mb-2 [&_strong]:font-bold [&_em]:italic [&_a]:text-amber-600 [&_a]:underline [&_a:hover]:text-amber-700 [&_img]:rounded-lg [&_img]:my-2 md:[&_img]:my-3 transition-all duration-300 ${
                              !isDescriptionExpanded ? 'line-clamp-3 md:line-clamp-4' : ''
                            }`}
                            dangerouslySetInnerHTML={{ __html: displayDescription }}
                          />
                          {!isDescriptionExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-10 md:h-12 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 md:mt-3 text-amber-600 hover:text-amber-700 font-semibold text-[10px] md:text-xs flex items-center gap-1 transition-colors"
                        >
                          {isDescriptionExpanded
                            ? (language === 'ar' ? 'عرض أقل' : 'Read Less')
                            : (language === 'ar' ? 'قراءة المزيد' : 'Read More')}
                          <svg
                            className={`w-3 md:w-3.5 h-3 md:h-3.5 transition-transform duration-300 ${
                              isDescriptionExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-[10px] md:text-xs text-gray-600 leading-relaxed">
                        {/* Check if product is UFO Drip Coffee */}
                        {product && (product.name?.toLowerCase().includes('ufo') || product.category?.name?.toLowerCase().includes('ufo')) ? (
                          // UFO Drip Coffee Brewing Guide
                          language === 'ar' ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Coffee className="w-4 h-4 text-amber-600" />
                                <h3 className="text-sm md:text-base font-bold text-gray-800">دليل تحضير قهوة UFO دريب</h3>
                              </div>
                              <p className="mb-3 text-gray-700">استمتع بقهوة UFO في خطوات بسيطة:</p>
                              
                              <div className="space-y-2.5">
                                <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                                    جهز معداتك
                                  </h4>
                                  <p className="text-gray-700">احصل على كوبك والميزان جاهزين.</p>
                                </div>

                                <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    افتح القرص
                                  </h4>
                                  <p className="text-gray-700">انزع الغطاء الواقي من قرص قهوة UFO.</p>
                                </div>

                                <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                  <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                                    ضع واسكب
                                  </h4>
                                  <p className="text-gray-700">ضع قرص UFO فوق كوبك واسكب 225 مل من الماء الساخن (90-93 درجة مئوية) ببطء وبشكل متساوٍ.</p>
                                </div>

                                <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                  <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Clock className="w-3.5 h-3.5 text-red-600" />
                                    اترك القهوة تتخمر
                                  </h4>
                                  <p className="text-gray-700">دعها تتخمر بشكل طبيعي لمدة 2-3 دقائق.</p>
                                </div>

                                <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                    استمتع
                                  </h4>
                                  <p className="text-gray-700">أزل القرص واستمتع بقهوتك الطازجة.</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Coffee className="w-4 h-4 text-amber-600" />
                                <h3 className="text-sm md:text-base font-bold text-gray-800">UFO Drip Coffee Brewing Guide</h3>
                              </div>
                              <p className="mb-3 text-gray-700">Experience your UFO coffee in just a few easy steps:</p>
                              
                              <div className="space-y-2.5">
                                <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                                    Prepare Your Setup
                                  </h4>
                                  <p className="text-gray-700">Get your cup and scale ready.</p>
                                </div>

                                <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    Open the Disc
                                  </h4>
                                  <p className="text-gray-700">Peel off the protective lid from the UFO coffee disc.</p>
                                </div>

                                <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                  <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                                    Place & Pour
                                  </h4>
                                  <p className="text-gray-700">Position the UFO disc on top of your cup and pour 225ml of hot water (90–93°C) slowly and evenly.</p>
                                </div>

                                <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                  <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Clock className="w-3.5 h-3.5 text-red-600" />
                                    Brew & Wait
                                  </h4>
                                  <p className="text-gray-700">Let it brew naturally for 2–3 minutes.</p>
                                </div>

                                <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                    Enjoy
                                  </h4>
                                  <p className="text-gray-700">Remove the disc and savor your freshly brewed coffee.</p>
                                </div>
                              </div>
                            </>
                          )
                        ) : product && (product.name?.toLowerCase().includes('capsule') || product.category?.name?.toLowerCase().includes('capsule')) ? (
                          // Coffee Capsule Brewing Guide
                          language === 'ar' ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Coffee className="w-4 h-4 text-amber-600" />
                                <h3 className="text-sm md:text-base font-bold text-gray-800">دليل تحضير كبسولات القهوة</h3>
                              </div>
                              <p className="mb-3 text-gray-700">احصل على أفضل نكهة من كل كبسولة باتباع هذه الخطوات البسيطة:</p>
                              
                              <div className="space-y-2.5">
                                <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                                    التحضير المسبق
                                  </h4>
                                  <p className="text-gray-700">جهز أدوات التحضير الخاصة بك وتأكد من نظافة الماكينة.</p>
                                </div>

                                <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    حافظ على النظافة
                                  </h4>
                                  <p className="text-gray-700">تأكد دائمًا من خلو معدات القهوة والحاويات من البقايا للحصول على طعم نقي.</p>
                                </div>

                                <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                  <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <RotateCw className="w-3.5 h-3.5 text-purple-600" />
                                    اضبط بذكاء
                                  </h4>
                                  <p className="text-gray-700">قد تختلف إعدادات التحضير حسب تاريخ التحميص والطريقة — اضبطها وفقًا لذلك.</p>
                                </div>

                                <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                  <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <BarChart3 className="w-3.5 h-3.5 text-red-600" />
                                    كن متسقًا
                                  </h4>
                                  <p className="text-gray-700">استخدم ماء عالي الجودة، وحافظ على دقة القياسات والنسب والتوقيت.</p>
                                </div>

                                <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                    تذكر!
                                  </h4>
                                  <p className="text-gray-700">ثق بحاسة التذوق لديك، وحسّن وصفتك، واستمتع بالعملية — القهوة تجربة وليست قاعدة.</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Coffee className="w-4 h-4 text-amber-600" />
                                <h3 className="text-sm md:text-base font-bold text-gray-800">Coffee Capsule Brewing Guide</h3>
                              </div>
                              <p className="mb-3 text-gray-700">Get the best flavor from every capsule with these simple steps:</p>
                              
                              <div className="space-y-2.5">
                                <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                                    Prepare Ahead
                                  </h4>
                                  <p className="text-gray-700">Have your brewing tools ready and your machine clean.</p>
                                </div>

                                <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    Keep It Clean
                                  </h4>
                                  <p className="text-gray-700">Always ensure your coffee gear and containers are free of residue for a pure taste.</p>
                                </div>

                                <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                  <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <RotateCw className="w-3.5 h-3.5 text-purple-600" />
                                    Adjust Smartly
                                  </h4>
                                  <p className="text-gray-700">Grind size and brew settings may vary depending on your coffee's roast date and method — adjust accordingly.</p>
                                </div>

                                <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                  <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <BarChart3 className="w-3.5 h-3.5 text-red-600" />
                                    Be Consistent
                                  </h4>
                                  <p className="text-gray-700">Use good-quality water, and stay precise with measurements, ratios, and timing.</p>
                                </div>

                                <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                  <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                    Remember!
                                  </h4>
                                  <p className="text-gray-700">Trust your palate, refine your recipe, and enjoy the process — coffee is an experience, not a rule.</p>
                                </div>
                              </div>
                            </>
                          )
                        ) : (
                          // Regular Coffee Brewing Guide
                          language === 'ar' ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Coffee className="w-4 h-4 text-amber-600" />
                              <h3 className="text-sm md:text-base font-bold text-gray-800">دليل تحضير القهوة المثالية</h3>
                            </div>
                            <p className="mb-3 text-gray-700">اتبع هذه الخطوات لاستخلاص أفضل نكهة من قهوتك:</p>
                            
                            <div className="space-y-2.5">
                              <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                                  نسبة القهوة إلى الماء
                                </h4>
                                <p className="text-gray-700">استخدم ١٥-٢٠ جرام من القهوة لكل ٢٢٥-٣٠٠ مل من الماء، حسب القوة المفضلة لديك.</p>
                              </div>

                              <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Thermometer className="w-3.5 h-3.5 text-red-600" />
                                  درجة حرارة الماء
                                </h4>
                                <p className="text-gray-700">سخن الماء إلى ٩٠-٩٦ درجة مئوية (١٩٤-٢٠٥ فهرنهايت) للحصول على استخلاص مثالي.</p>
                              </div>

                              <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Scissors className="w-3.5 h-3.5 text-blue-600" />
                                  حجم الطحن
                                </h4>
                                <p className="text-gray-700 mb-1.5">اطحن القهوة مباشرة قبل التحضير للحفاظ على النضارة.</p>
                                <ul className="space-y-0.5 mr-3 text-gray-600">
                                  <li>• <strong>القهوة المقطرة:</strong> طحن متوسط (≈٧٠٠-٨٠٠ ميكرون)</li>
                                  <li>• <strong>الإسبريسو:</strong> طحن ناعم</li>
                                  <li>• <strong>الفرنش برس:</strong> طحن خشن</li>
                                </ul>
                              </div>

                              <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                  وقت التحضير
                                </h4>
                                <ul className="space-y-0.5 mr-3 text-gray-700">
                                  <li>• <strong>الإسبريسو:</strong> ٢٣-٣٠ ثانية</li>
                                  <li>• <strong>القهوة المقطرة:</strong> ٢:٣٠-٤:٠٠ دقائق (مع التفتح والصب)</li>
                                  <li>• <strong>الفرنش برس:</strong> ٤ دقائق</li>
                                </ul>
                              </div>

                              <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  اللمسة النهائية
                                </h4>
                                <p className="text-gray-700">بعد انتهاء التحضير، قم بالتحريك برفق واستمتع بفنجان قهوتك المتوازن من محمصة سبيريت هب.</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Coffee className="w-4 h-4 text-amber-600" />
                              <h3 className="text-sm md:text-base font-bold text-gray-800">Perfect Coffee Brewing Guide</h3>
                            </div>
                            <p className="mb-3 text-gray-700">Follow these steps to extract the best flavor from your coffee:</p>
                            
                            <div className="space-y-2.5">
                              <div className="bg-amber-50 p-2.5 md:p-3 rounded-lg border border-amber-100">
                                <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                                  Coffee to Water Ratio
                                </h4>
                                <p className="text-gray-700">Use 15–20g of coffee for every 225–300ml of water, depending on your preferred strength.</p>
                              </div>

                              <div className="bg-red-50 p-2.5 md:p-3 rounded-lg border border-red-100">
                                <h4 className="font-bold text-red-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Thermometer className="w-3.5 h-3.5 text-red-600" />
                                  Water Temperature
                                </h4>
                                <p className="text-gray-700">Heat water to 90–96°C (194–205°F) for ideal extraction.</p>
                              </div>

                              <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Scissors className="w-3.5 h-3.5 text-blue-600" />
                                  Grind Size
                                </h4>
                                <p className="text-gray-700 mb-1.5">Grind coffee just before brewing for freshness.</p>
                                <ul className="space-y-0.5 ml-3 text-gray-600">
                                  <li>• <strong>Pour Over:</strong> Medium grind (≈700–800 microns)</li>
                                  <li>• <strong>Espresso:</strong> Fine grind</li>
                                  <li>• <strong>French Press:</strong> Coarse grind</li>
                                </ul>
                              </div>

                              <div className="bg-purple-50 p-2.5 md:p-3 rounded-lg border border-purple-100">
                                <h4 className="font-bold text-purple-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                  Brewing Time
                                </h4>
                                <ul className="space-y-0.5 ml-3 text-gray-700">
                                  <li>• <strong>Espresso:</strong> 23–30 seconds</li>
                                  <li>• <strong>Pour Over:</strong> 2:30–4:00 minutes (bloom + pours)</li>
                                  <li>• <strong>French Press:</strong> 4 minutes</li>
                                </ul>
                              </div>

                              <div className="bg-linear-to-r from-amber-50 to-orange-50 p-2.5 md:p-3 rounded-lg border border-amber-200">
                                <h4 className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  Final Touch
                                </h4>
                                <p className="text-gray-700">Once brewing is complete, swirl gently and enjoy your perfectly balanced cup of coffee from SpiritHub Roastery.</p>
                              </div>
                            </div>
                          </>
                          )
                        )}
                      </div>
                    )}
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
