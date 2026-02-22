import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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
import { useAuth } from '../hooks/useAuth';
import { useShopPage } from '../hooks/useShop';
import { productService } from '../services/productService';
import { productReviewService } from '../services/productReviewService';
import { productTagService } from '../services/productTagService';
import { getProductImageUrl, handleImageError, resolveProductImageUrls } from '../lib/imageUtils';
import { generateProductSeoMetadata } from '../lib/productSeoUtils';
import type { Product as ApiProduct, ProductReview, ProductVariant, ProductReviewCreateDto } from '../types/product';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Seo } from '../components/seo/Seo';
import { siteMetadata, resolveAbsoluteUrl } from '../config/siteMetadata';
import { ProductShare } from '../components/products/ProductShare';
import { ProductTagBadge } from '../components/shop/ProductTagBadge';
import { ProductViewers } from '../components/ui/LiveVisitors';
import { toast } from 'sonner';
import { getVariantStock, clampQuantity } from '../lib/stockUtils';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type ApprovedReviewStats = {
  averageRating: number;
  totalReviews: number;
};

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

const isUfoDripProduct = (product?: ApiProduct | null): boolean => {
  const name = (product?.name || '').toLowerCase();
  const slug = (product?.slug || '').toLowerCase();
  return name.includes('ufo drip') || slug.includes('ufo-drip');
};

const isCapsuleProduct = (product?: ApiProduct | null): boolean => {
  const name = (product?.name || '').toLowerCase();
  const slug = (product?.slug || '').toLowerCase();
  const category = (product?.category?.name || '').toLowerCase();
  return name.includes('capsule') || slug.includes('capsule') || category.includes('capsule');
};

// isVelvetHarmonyDiscovery is now determined dynamically by checking
// whether the product's category exists in the shop categories list.

const resolveVariantLabel = (variant: ProductVariant, language: string, product?: ApiProduct | null): string => {
  if (isUfoDripProduct(product)) {
    return '7 PCS';
  }
  if (isCapsuleProduct(product)) {
    return language === 'ar' ? '10 كبسولات' : '10 PCS';
  }
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

export const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const { language, t } = useApp();
  const isArabic = language === 'ar';
  const { currentRegion } = useRegion();
  const isShopRoute = location.pathname.includes('/shop/');
  const { isAuthenticated, user } = useAuth();
  const cart = useCart();

  const [state, setState] = useState<LoadState>('idle');
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Format currency based on current region and language
  const formatCurrency = (value: number, lang: string): string => {
    const formatted = value.toFixed(3);
    
    // For Arabic: show Arabic currency symbol (ر.ع. or ر.س)
    if (lang === 'ar') {
      return `${formatted} ${currentRegion.currencySymbol}`;
    }
    
    // For English: show currency code (OMR or SAR)
    return `${formatted} ${currentRegion.currency}`;
  };
  
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'brewing'>('description');
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [approvedReviewStatsRemote, setApprovedReviewStatsRemote] = useState<ApprovedReviewStats | null>(null);
  const [reviewForm, setReviewForm] = useState<ProductReviewCreateDto>({
    productId: 0,
    rating: 5,
    title: '',
    content: '',
    customerName: '',
    customerEmail: '',
  });

  const approvedReviewStatsLocal = useMemo<ApprovedReviewStats | null>(() => {
    const reviews = (product?.reviews ?? []) as ProductReview[];
    if (!reviews.length) return null;

    const approved = reviews.filter((review) => review.isApproved);
    if (!approved.length) {
      return { averageRating: 0, totalReviews: 0 };
    }
    const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return {
      averageRating: sum / approved.length,
      totalReviews: approved.length,
    };
  }, [product?.reviews]);

  useEffect(() => {
    let cancelled = false;

    const loadApprovedReviewStats = async () => {
      if (!product?.id) return;

      // If product payload already contains reviews, prefer local computation.
      if ((product?.reviews ?? []).length > 0) {
        setApprovedReviewStatsRemote(null);
        return;
      }

      try {
        const pageSize = 100;
        const maxPages = 5;
        let page = 1;
        let totalPages = 1;
        const all: ProductReview[] = [];

        while (page <= totalPages && page <= maxPages) {
          const res = await productReviewService.getByProduct(product.id, page, pageSize);
          totalPages = res.totalPages || 1;
          all.push(...(res.items ?? []));
          page += 1;
        }

        const approved = all.filter((review) => review.isApproved);
        const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        const stats: ApprovedReviewStats = {
          averageRating: approved.length ? sum / approved.length : 0,
          totalReviews: approved.length,
        };

        if (!cancelled) setApprovedReviewStatsRemote(stats);
      } catch (err) {
        console.error('Failed to load approved review stats', err);
        // Be conservative: on error, avoid using product.averageRating/reviewCount (may include pending).
        if (!cancelled) setApprovedReviewStatsRemote({ averageRating: 0, totalReviews: 0 });
      }
    };

    loadApprovedReviewStats();
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.reviews]);

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
      setErrorMessage('');

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

        // Enrich with all tags (backend may only embed a subset)
        const productNumericId = typeof sanitized.id === 'string' ? Number(sanitized.id) : sanitized.id;
        if (productNumericId) {
          Promise.all([
            productTagService.getProductTopTags(productNumericId).catch(() => []),
            productTagService.getProductBottomTags(productNumericId).catch(() => []),
          ]).then(([fetchedTop, fetchedBottom]) => {
            if (!isMounted) return;
            setProduct((prev) => {
              if (!prev || (typeof prev.id === 'string' ? Number(prev.id) : prev.id) !== productNumericId) return prev;
              const needsUpdate =
                (fetchedTop.length > 0 && fetchedTop.length !== (prev.topTags?.length ?? 0)) ||
                (fetchedBottom.length > 0 && fetchedBottom.length !== (prev.bottomTags?.length ?? 0));
              if (!needsUpdate) return prev;
              return {
                ...prev,
                topTags: fetchedTop.length > 0 ? fetchedTop : prev.topTags,
                bottomTags: fetchedBottom.length > 0 ? fetchedBottom : prev.bottomTags,
              };
            });
          });
        }

        setIsReviewsDialogOpen(false);
        setCanReview(null);
        setReviewForm((prev) => ({
          ...prev,
          productId: sanitized.id,
          rating: 5,
          title: '',
          content: '',
          customerName: user?.displayName || user?.username || '',
          customerEmail: '',
        }));
        const defaultVariant =
          activeVariants.find((variant) => variant.isDefault) ?? activeVariants[0] ?? null;
        setSelectedVariantId(defaultVariant ? defaultVariant.id : null);
        setQuantity(1);
        setCurrentImageIndex(0);
        setState('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        // Check if it's a 404 error (product not found)
        const apiError = error as { statusCode?: number };
        const is404 = apiError?.statusCode === 404;

        setProduct(null);
        setState('error');
        setErrorMessage(
          is404
            ? (language === 'ar' ? 'لم يتم العثور على هذا المنتج.' : 'We could not find that product.')
            : (language === 'ar'
                ? 'حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة لاحقاً.'
                : 'Something went wrong while loading this product. Please try again later.')
        );
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [language, productId, currentRegion.code]);

  useEffect(() => {
    let cancelled = false;

    const checkCanReview = async () => {
      if (!product) return;

      // If user isn't authenticated, allow the form and let API enforce.
      if (!isAuthenticated) {
        setCanReview(true);
        return;
      }

      try {
        const allowed = await productReviewService.canReview(product.id);
        if (!cancelled) setCanReview(Boolean(allowed));
      } catch (err) {
        // If endpoint is not available / unauthorized, don't block the UI.
        if (!cancelled) setCanReview(true);
      }
    };

    checkCanReview();
    return () => {
      cancelled = true;
    };
  }, [product, isAuthenticated]);

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

  // Effective stock ceiling for the selected variant
  const variantStock = getVariantStock(selectedVariant);
  const maxQty = variantStock ?? 10;

  // Reset quantity when variant changes so it doesn't exceed new variant's stock
  useEffect(() => {
    setQuantity((prev) => clampQuantity(prev, variantStock));
  }, [selectedVariantId, variantStock]);

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

  const { shopData, loading: shopDataLoading } = useShopPage();

  // When accessed via a shop route, wait for shopData before deciding layout.
  // This prevents the flash from normal → shop layout.
  const shopDataReady = !isShopRoute || !shopDataLoading;

  const isVelvetHarmonyDiscovery = useMemo(() => {
    if (!product || !shopData?.categories) return false;
    return shopData.categories.some((cat) => cat.id === product.categoryId);
  }, [product, shopData]);

  const isGiftCard = useMemo(() => {
    if (!product) return false;
    const categoryFromShop = shopData?.categories?.find((cat) => cat.id === product.categoryId);
    const categorySlug = (product.category?.slug || categoryFromShop?.slug || '').toLowerCase();
    const categoryName = (product.category?.name || categoryFromShop?.name || '').toLowerCase();
    const productType = (product as { type?: string })?.type;
    const rawTags = (product as { tags?: string | string[] })?.tags;
    const tagList = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
        ? rawTags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
    const hasGiftTag = tagList.some((tag) => /gift\s*card|giftcard/i.test(tag));

    return (
      categorySlug === 'electronic-gift-cards' ||
      categoryName === 'electronic gift cards' ||
      productType === 'gift_card' ||
      hasGiftTag
    );
  }, [product, shopData]);

  const price = useMemo(() => {
    if (!product) {
      return 0;
    }

    return resolvePrice(product, selectedVariant);
  }, [product, selectedVariant]);

  const hideVariantPrice = isUfoDripProduct(product) || isCapsuleProduct(product);

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
      const priceText = price > 0 ? ` - ${price.toFixed(3)} ${currentRegion.currency}` : '';
      
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

    const reviewStats = approvedReviewStatsLocal ?? approvedReviewStatsRemote;
    const approvedAverage = reviewStats?.averageRating ?? 0;
    const approvedCount = reviewStats?.totalReviews ?? 0;

    const imageList = images
      .map((img) => resolveAbsoluteUrl(img))
      .filter((src): src is string => Boolean(src));

    const offerPrice = price > 0 ? price.toFixed(3) : undefined;
    const aggregate = approvedCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: approvedAverage,
          reviewCount: approvedCount,
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
            priceCurrency: currentRegion.currency,
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
  }, [canonicalUrl, displayName, images, price, product, seoDescription, language, approvedReviewStatsLocal, approvedReviewStatsRemote]);

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
  const averageRating = (approvedReviewStatsLocal ?? approvedReviewStatsRemote)?.averageRating ?? 0;
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
    setQuantity((prev) => {
      const ceiling = maxQty;
      if (prev >= ceiling) {
        toast.warning(`Only ${ceiling} available`);
        return prev;
      }
      return Math.min(ceiling, prev + 1);
    });
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

    // Clamp quantity to available stock
    const safeQty = clampQuantity(quantity, variantStock);

    const variantLabel = selectedVariant ? resolveVariantLabel(selectedVariant, language, product) : '';
    // For shop products (isVelvetHarmonyDiscovery), hide weight from cart display
    const showWeightInCart = !isVelvetHarmonyDiscovery;
    const cartName = (variantLabel && showWeightInCart) ? `${displayName} - ${variantLabel}` : displayName;
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
      variantName: (variantLabel && showWeightInCart) ? variantLabel : undefined,
      weight: showWeightInCart ? selectedVariant?.weight : undefined,
      weightUnit: showWeightInCart ? selectedVariant?.weightUnit : undefined,
      maxStock: variantStock,
    }, safeQty);

    cart.openCart();
  };

  const addToCartLabel =
    language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart';
  const unavailableLabel =
    language === 'ar' ? 'غير متوفر حالياً' : 'Currently unavailable';
  const chooseOptionLabel =
    language === 'ar' ? 'اختر الحجم' : 'Choose size';
  const stockLabel =
    language === 'ar' ? 'متوفر في المخزون' : 'In Stock';

  const submitReview = async () => {
    if (!product) return;

    const rating = Number(reviewForm.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error(language === 'ar' ? 'الرجاء اختيار تقييم من 1 إلى 5' : 'Please choose a rating from 1 to 5');
      return;
    }
    if (!reviewForm.content || reviewForm.content.trim().length < 10) {
      toast.error(language === 'ar' ? 'اكتب مراجعة أطول (10 أحرف على الأقل)' : 'Please write a longer review (at least 10 characters)');
      return;
    }
    if (!isAuthenticated) {
      if (!reviewForm.customerName || reviewForm.customerName.trim().length < 2) {
        toast.error(language === 'ar' ? 'الرجاء كتابة الاسم' : 'Please enter your name');
        return;
      }
    }

    try {
      setReviewSubmitting(true);
      await productReviewService.create({
        productId: product.id,
        rating,
        title: reviewForm.title?.trim() || undefined,
        content: reviewForm.content.trim(),
        customerName: isAuthenticated ? (user?.displayName || user?.username) : (reviewForm.customerName?.trim() || undefined),
        customerEmail: isAuthenticated ? undefined : (reviewForm.customerEmail?.trim() || undefined),
      });

      toast.success(
        language === 'ar'
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
      toast.error(err?.response?.data?.message || err?.message || (language === 'ar' ? 'تعذر إرسال المراجعة' : 'Failed to submit review'));
    } finally {
      setReviewSubmitting(false);
    }
  };

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
                  <Link to={isShopRoute ? `/${currentRegion.code}/shop` : '/products'}>
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

            {(state === 'loading' || (state === 'ready' && !shopDataReady)) ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-3 md:p-4 lg:p-6">
                  <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                    {/* Image Gallery Skeleton */}
                    <div className="space-y-3">
                      <div className="aspect-square w-full animate-pulse rounded-xl bg-gray-100" />
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                      </div>
                    </div>
                    {/* Product Info Skeleton */}
                    <div className="space-y-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-50" />
                      </div>
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-4 w-4 animate-pulse rounded bg-gray-100" />
                          ))}
                        </div>
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-50" />
                      </div>
                      {/* Price */}
                      <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
                      {/* Variants */}
                      <div className="space-y-2">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-50" />
                        <div className="flex gap-2">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="h-10 w-20 animate-pulse rounded-lg bg-gray-100" />
                          ))}
                        </div>
                      </div>
                      {/* Quantity + Add to Cart */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-100" />
                        <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-100" />
                      </div>
                      {/* Description lines */}
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-50" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-50" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-50" />
                      </div>
                    </div>
                  </div>
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
                    to={isShopRoute ? `/${currentRegion.code}/shop` : '/products'}
                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                  >
                    {isShopRoute
                      ? (language === 'ar' ? 'العودة إلى المتجر' : 'Back to shop')
                      : (language === 'ar' ? 'العودة إلى المنتجات' : 'Back to products')}
                  </Link>
                </div>
              </div>
            ) : null}

            {state === 'ready' && product && shopDataReady ? (
              <>
                {/* Product Details Card */}
                {isVelvetHarmonyDiscovery ? (
                  <div className="bg-[#fbf8f3] rounded-2xl shadow-lg overflow-hidden border border-stone-200">
                    <div className="p-3 md:p-4 lg:p-6">
                      <div className="grid lg:grid-cols-[0.48fr_0.52fr] gap-4 md:gap-6 lg:gap-8">
                        {/* Image Gallery */}
                        <div className="space-y-2 md:space-y-3">
                          <div 
                            className="relative bg-[#fbf8f3] rounded-2xl overflow-hidden aspect-square w-full max-h-[65vh] md:max-h-none cursor-zoom-in"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            <img
                              src={images[currentImageIndex]}
                              alt={getImageAlt(currentImageIndex)}
                              width={600}
                              height={600}
                              fetchPriority="high"
                              decoding="async"
                              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-200 ${
                                isZooming ? 'scale-150' : 'scale-100'
                              } zoom-origin-var`}
                              onError={(event) =>
                                handleImageError(event, '/images/products/default-product.webp')
                              }
                            />

                            {!isAvailable ? (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold text-xs">
                                  {unavailableLabel}
                                </span>
                              </div>
                            ) : null}

                            {images.length > 1 ? (
                              <div className={`absolute inset-x-0 top-1/2 flex justify-between px-3 text-white ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
                                    width={64}
                                    height={64}
                                    loading="eager"
                                    decoding="sync"
                                    fetchPriority="high"
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

                        {/* Velvet Harmony Discovery Layout */}
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl lg:text-3xl font-bold text-stone-900">{displayName}</h1>

                                {averageRating > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setIsReviewsDialogOpen(true)}
                                    className="flex items-center gap-1.5 text-left text-stone-500 hover:opacity-90"
                                    aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                                  >
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-3 h-3 ${
                                            star <= averageRating
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[11px] text-stone-400 underline-offset-2 hover:underline">
                                      ({averageRating.toFixed(1)})
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setIsReviewsDialogOpen(true)}
                                    className="flex items-center gap-1.5 text-left text-stone-400 hover:opacity-90"
                                    aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                                  >
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-3 h-3 text-gray-300" />
                                      ))}
                                    </div>
                                    <span className="text-[11px] text-stone-400 underline-offset-2 hover:underline">(0.0)</span>
                                  </button>
                                )}

                                {product && <ProductViewers productId={String(product.id)} />}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {isGiftCard
                                  ? [
                                      isArabic ? 'تسليم فوري' : 'Instant delivery',
                                      isArabic ? 'البريد وواتساب' : 'Email & WhatsApp',
                                      isArabic ? 'هدية رقمية' : 'Digital Gift',
                                    ].map((label) => (
                                      <span
                                        key={label}
                                        className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-600"
                                      >
                                        {label}
                                      </span>
                                    ))
                                  : (
                                      <>
                                        {product.topTags && product.topTags.length > 0 ? (
                                          product.topTags.map((tag) => (
                                            <ProductTagBadge key={tag.id} tag={tag} size="md" />
                                          ))
                                        ) : null}
                                      </>
                                    )}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                            {displayDescription ? (
                              <div
                                className="text-xs text-stone-600 leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold"
                                dangerouslySetInnerHTML={{ __html: displayDescription }}
                              />
                            ) : (
                              <p className="text-xs text-stone-500">
                                {language === 'ar' ? 'تفاصيل هذا المنتج ستتوفر قریباً.' : 'Details for this product are coming soon.'}
                              </p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-stone-600">
                                {language === 'ar' ? 'السعر' : 'Price'}
                              </span>
                              <div className="flex items-center gap-2">
                                {!topInStock ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                    {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                                  </span>
                                ) : null}
                                <span className="text-lg font-bold text-stone-900">
                                  {price > 0
                                    ? formatCurrency(price * quantity, language)
                                    : language === 'ar'
                                      ? 'السعر عند الطلب'
                                      : 'Price on request'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center h-11 border border-stone-200 rounded-full bg-stone-50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={decreaseQuantity}
                                  className="h-11 w-11 text-base font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-transform duration-150 active:scale-95 disabled:text-stone-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={quantity <= 1}
                                  aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                                >
                                  –
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setQuantity(clampQuantity(val, variantStock));
                                  }}
                                  className="h-11 w-12 md:w-14 text-sm font-semibold text-stone-900 text-center border-x border-stone-200 focus:outline-none focus:bg-stone-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="1"
                                  max={maxQty}
                                  aria-label={language === 'ar' ? 'الكمية' : 'Quantity'}
                                />
                                <button
                                  type="button"
                                  onClick={increaseQuantity}
                                  className="h-11 w-11 text-base font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-transform duration-150 active:scale-95 disabled:text-stone-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={quantity >= maxQty}
                                  aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                                >
                                  +
                                </button>
                              </div>

                              <Button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!isAvailable || price <= 0 || isVariantOutOfStock}
                                className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#7a1f2b] hover:bg-[#651a23] text-white font-semibold text-xs md:text-sm shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                {isVariantOutOfStock || !topInStock
                                  ? (language === 'ar' ? 'غير متوفر' : 'Out of Stock')
                                  : addToCartLabel}
                              </Button>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {isGiftCard ? (
                                <>
                                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-semibold text-stone-600">
                                    ⏱ Valid for 12 months
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-semibold text-stone-600">
                                    📩 Sent by email / WhatsApp
                                  </span>
                                </>
                              ) : (
                                <>
                                  {product.bottomTags && product.bottomTags.length > 0 ? (
                                    product.bottomTags.map((tag) => (
                                      <ProductTagBadge key={tag.id} tag={tag} />
                                    ))
                                  ) : null}
                                </>
                              )}
                            </div>

                            <p className="text-[10px] text-stone-500 italic text-center">
                              {language === 'ar' ? 'محمص طازج أسبوعياً في عمان' : 'Roasted fresh weekly in Oman'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-3 md:p-4 lg:p-6">
                      <div className="grid lg:grid-cols-[0.48fr_0.52fr] gap-4 md:gap-6 lg:gap-8">
                        {/* Mobile: Product Name & Rating - Show above image */}
                        <div className="lg:hidden mb-3">
                          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{displayName}</h2>
                          
                          {/* Top Tags - Mobile */}
                          {product.topTags && product.topTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {product.topTags.map((tag) => (
                                <ProductTagBadge key={tag.id} tag={tag} size="md" />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 md:gap-3">
                            {averageRating > 0 ? (
                              <button
                                type="button"
                                onClick={() => setIsReviewsDialogOpen(true)}
                                className="flex items-center gap-1.5 md:gap-2 text-left hover:opacity-90"
                                aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                              >
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 md:w-3.5 h-3 md:h-3.5 ${
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
                                onClick={() => setIsReviewsDialogOpen(true)}
                                className="flex items-center gap-1.5 md:gap-2 text-left hover:opacity-90"
                                aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                              >
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="w-3 md:w-3.5 h-3 md:h-3.5 text-gray-300" />
                                  ))}
                                </div>
                                <span className="text-[10px] md:text-xs text-gray-400 underline-offset-2 hover:underline">(0.0)</span>
                              </button>
                            )}

                            {product && <ProductViewers productId={String(product.id)} />}

                          </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="space-y-2 md:space-y-3">
                          <div 
                            className="relative bg-[#fbf8f3] rounded-xl overflow-hidden aspect-square w-full max-h-[65vh] md:max-h-none cursor-zoom-in"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            <img
                              src={images[currentImageIndex]}
                              alt={getImageAlt(currentImageIndex)}
                              width={600}
                              height={600}
                              fetchPriority="high"
                              decoding="async"
                              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-200 ${
                                isZooming ? 'scale-150' : 'scale-100'
                              } zoom-origin-var`}
                              onError={(event) =>
                                handleImageError(event, '/images/products/default-product.webp')
                              }
                            />

                            {(product.isFeatured || product.isPremium || product.isLimited) ? (
                              <div className="absolute top-3 ltr:left-3 rtl:right-3 flex flex-col gap-2">
                                {product.isFeatured ? (
                                  <div className="bg-linear-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md w-fit">
                                    {language === 'ar' ? 'مميز' : 'Featured'}
                                  </div>
                                ) : null}
                                {product.isPremium ? (
                                  <div className="bg-linear-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md w-fit">
                                    {t('sections.bestSellerBadge')}
                                  </div>
                                ) : null}
                                {product.isLimited ? (
                                  <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md w-fit">
                                    {t('sections.limitedBadge')}
                                  </div>
                                ) : null}
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
                              <div className={`absolute inset-x-0 top-1/2 flex justify-between px-3 text-white ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
                                    width={64}
                                    height={64}
                                    loading="eager"
                                    decoding="sync"
                                    fetchPriority="high"
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
                          {/* Product Name & Rating - Desktop only */}
                          <div className="hidden lg:block">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                            
                            {/* Top Tags - Desktop */}
                            {product.topTags && product.topTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {product.topTags.map((tag) => (
                                  <ProductTagBadge key={tag.id} tag={tag} size="md" />
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              {averageRating > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setIsReviewsDialogOpen(true)}
                                  className="flex items-center gap-2 text-left hover:opacity-90"
                                  aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                                >
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
                                  <span className="text-xs text-gray-600 underline-offset-2 hover:underline">
                                    ({averageRating.toFixed(1)})
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsReviewsDialogOpen(true)}
                                  className="flex items-center gap-2 text-left hover:opacity-90"
                                  aria-label={language === 'ar' ? 'عرض المراجعات' : 'View reviews'}
                                >
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className="w-3.5 h-3.5 text-gray-300" />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-400 underline-offset-2 hover:underline">(0.0)</span>
                                </button>
                              )}

                              {product && <ProductViewers productId={String(product.id)} />}

                              {topInStock ? (
                                <div className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full ml-auto">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-[10px] font-semibold">{stockLabel}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-full ml-auto">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span className="text-[10px] font-semibold">{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                        {/* Coffee Information - Compact List */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2.5 md:p-3 space-y-1.5 md:space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Coffee className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-700/70" />
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-900">
                              {language === 'ar' ? 'معلومات القهوة' : 'Coffee Information'}
                            </h3>
                          </div>

                          <div className="space-y-1 md:space-y-1.5 text-[10px] md:text-xs">{/* Roast Level */}
                            {(language === 'ar' ? product.roastLevelAr : product.roastLevel) ? (
                              <div className="flex items-center gap-2">
                                <Flame className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0" />
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
                                <RotateCw className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0" />
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
                                <BarChart3 className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0" />
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
                                <MapPin className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0" />
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
                                <Wheat className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0" />
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
                                <ClipboardList className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-600/70 shrink-0 mt-0.5" />
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
                                    <Coffee className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 text-rose-600/70 shrink-0" />
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
                          <div className="flex items-center justify-between py-0.5 md:py-1 border-b border-amber-200/50 pb-1.5 md:pb-2">
                            <div className="flex items-center gap-1.5">
                              <Coffee className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-700/70" />
                              <div className="flex flex-col">
                                <span className="text-[11px] md:text-sm text-gray-700 font-semibold">
                                  {language === 'ar' ? 'اختر الحجم' : 'Choose Size'}
                                </span>
                                {isUfoDripProduct(product) ? (
                                  <span className="text-[9px] md:text-[10px] text-emerald-700">
                                    {language === 'ar'
                                      ? '♻️ علب يو إف أو دريب قابلة لإعادة التدوير'
                                      : '♻️ UFO Drip Boxes – 100% recyclable'}
                                  </span>
                                ) : isCapsuleProduct(product) ? (
                                  <span className="text-[9px] md:text-[10px] text-emerald-700">
                                    {language === 'ar'
                                      ? '♻️ كبسولات ألمنيوم قابلة لإعادة التدوير'
                                      : '♻️ Aluminium capsules – 100% recyclable'}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!topInStock ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                  {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                                </span>
                              ) : null}
                              <span className="text-xl md:text-2xl font-bold text-amber-900">
                                {price > 0
                                  ? formatCurrency(price * quantity, language)
                                  : language === 'ar'
                                    ? 'السعر عند الطلب'
                                    : 'Price on request'}
                              </span>
                            </div>
                          </div>

                          {/* Variant Selection */}
                          {product.variants && product.variants.length > 0 ? (
                            <div className="space-y-1.5 md:space-y-2 pt-0.5 md:pt-1">
                              <label className="sr-only">
                                {chooseOptionLabel}
                              </label>
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {product.variants.map((variant) => {
                                  const variantPrice = resolvePrice(product, variant);
                                  const label = resolveVariantLabel(variant, language, product);
                                  const isSelected = selectedVariant?.id === variant.id;
                                  const hasDiscount = variant.discountPrice && variant.discountPrice > 0 && variant.price && variant.discountPrice < variant.price;
                                  const variantOutOfStock = (variant.stockQuantity ?? 0) <= 0;
                                  const isUfoDrip = isUfoDripProduct(product);
                                  const isCapsule = isCapsuleProduct(product);
                                  
                                  return (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      onClick={() => setSelectedVariantId(variant.id)}
                                      className={`rounded-lg font-semibold min-w-[100px] md:min-w-[110px] text-xs md:text-sm ${
                                        isUfoDrip || isCapsule
                                          ? 'px-3 md:px-4 py-1.5 md:py-2 bg-[#6B4423] text-white border-2 border-[#6B4423] cursor-default'
                                          : `px-3 md:px-4 py-2 md:py-2.5 transition-all duration-200 ${
                                              isSelected
                                                ? 'bg-[#6B4423] hover:bg-[#5a3a1e] text-white shadow-md scale-105'
                                                : 'bg-white text-amber-900 hover:bg-amber-50 border-2 border-amber-300 hover:border-[#6B4423] hover:shadow-sm'
                                            }`
                                      } ${variantOutOfStock ? 'opacity-60' : ''}`}
                                    >
                                      <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <span className="text-xs md:text-sm font-bold">{label}</span>
                                        {isUfoDrip ? (
                                          <span className="text-[10px] md:text-[11px] text-white/80">
                                            {language === 'ar' ? '(7 أكياس تقطير فردية)' : '(7 single-serve drip filters)'}
                                          </span>
                                        ) : isCapsule ? (
                                          <span className="text-[10px] md:text-[11px] text-white/80">
                                            {language === 'ar' ? '(10 كبسولات قهوة)' : '(10 coffee capsules)'}
                                          </span>
                                        ) : null}
                                        {!hideVariantPrice && (
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
                                          </div>
                                        )}
                                        {variantOutOfStock && (
                                          <span className="text-[10px] text-red-600 font-semibold mt-1">
                                            {language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {/* Quantity and Add to Cart */}
                          <div className="pt-1 md:pt-2 space-y-2">
                            <span className="text-[10px] md:text-xs font-semibold text-gray-700">
                              {language === 'ar' ? 'الكمية' : 'Quantity'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center h-11 border-2 border-amber-300 rounded-lg bg-amber-100/60 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={decreaseQuantity}
                                  className="h-11 w-11 text-base font-extrabold text-amber-900 hover:text-[#6B4423] hover:bg-amber-200/60 transition-transform duration-150 active:scale-95 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={quantity <= 1}
                                  aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                                >
                                  –
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setQuantity(clampQuantity(val, variantStock));
                                  }}
                                  className="h-11 w-12 md:w-14 text-sm md:text-base font-bold text-gray-900 text-center border-x border-amber-200 focus:outline-none focus:bg-amber-100/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="1"
                                  max={maxQty}
                                  aria-label={language === 'ar' ? 'الكمية' : 'Quantity'}
                                />
                                <button
                                  type="button"
                                  onClick={increaseQuantity}
                                  className="h-11 w-11 text-base font-extrabold text-amber-900 hover:text-[#6B4423] hover:bg-amber-200/60 transition-transform duration-150 active:scale-95 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={quantity >= maxQty}
                                  aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                                >
                                  +
                                </button>
                              </div>

                              <Button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!isAvailable || price <= 0 || isVariantOutOfStock}
                                className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 md:gap-2 bg-[#6B4423] hover:bg-[#5a3a1e] text-white font-semibold text-xs md:text-sm shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <ShoppingCart className="w-3.5 md:w-4 h-3.5 md:h-4" />
                                {isVariantOutOfStock || !topInStock
                                  ? (language === 'ar' ? 'غير متوفر' : 'Out of Stock')
                                  : addToCartLabel}
                              </Button>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {isGiftCard ? (
                                <>
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-900/80">
                                    ⏱ Valid for 12 months
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-900/80">
                                    📩 Sent by email / WhatsApp
                                  </span>
                                </>
                              ) : (
                                <>
                                  {product.bottomTags && product.bottomTags.length > 0 ? (
                                    product.bottomTags.map((tag) => (
                                      <ProductTagBadge key={tag.id} tag={tag} />
                                    ))
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Roasted Fresh Weekly in Oman */}
                          <div className="text-center pt-0.5 md:pt-1 border-t border-amber-200/50">
                            <p className="text-[10px] md:text-xs text-gray-500 italic">
                              {language === 'ar' ? 'محمص طازج أسبوعياً في عمان' : 'Roasted fresh weekly in Oman'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs Section for Description */}
              {!isVelvetHarmonyDiscovery && displayDescription && (
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

                              <div className="bg-emerald-50 p-2.5 md:p-3 rounded-lg border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                                  وصفات سريعة
                                </h4>
                                <ul className="space-y-1 mr-3 text-gray-700">
                                  <li>• <strong>إسبريسو:</strong> ٢٠ جم قهوة → ٤٠ جم مستخلص خلال ٢٣–٣٠ ثانية</li>
                                  <li>• <strong>حليب:</strong> نسبة ١:٣ لاتيه، و١:٢ فلات وايت</li>
                                  <li>• <strong>فلتر:</strong> ٢٠ جم قهوة لكل ٣٠٠ جم ماء، وقت ٢:٤٥–٣:٣٠</li>
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

                              <div className="bg-emerald-50 p-2.5 md:p-3 rounded-lg border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs">
                                  <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                                  Actionable Recipes
                                </h4>
                                <ul className="space-y-1 ml-3 text-gray-700">
                                  <li>• <strong>Espresso:</strong> 20g in → 40g out in 23–30s</li>
                                  <li>• <strong>Milk:</strong> 1:3 ratio for latte, 1:2 for flat white</li>
                                  <li>• <strong>Filter:</strong> 20g coffee to 300g water, 2:45–3:30 brew</li>
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

              {/* Reviews Popup */}
              <Dialog open={isReviewsDialogOpen} onOpenChange={setIsReviewsDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden">
                  <div className="bg-white">
                    <div className="flex items-center gap-3 px-5 pt-5">
                      <div className="flex-1">
                        <DialogHeader>
                          <DialogTitle className={`text-base ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {language === 'ar' ? 'إرسال مراجعتك' : 'Send your review'}
                          </DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? product?.nameAr ?? product?.name : product?.name}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      {canReview === false ? (
                        <div className="mt-4 text-sm text-gray-600">
                          {language === 'ar'
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
                                  aria-label={language === 'ar' ? `تقييم ${value}` : `Rate ${value}`}
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
                                  {language === 'ar' ? 'الاسم' : 'Name'}
                                </label>
                                <Input
                                  value={reviewForm.customerName ?? ''}
                                  onChange={(e) => setReviewForm((prev) => ({ ...prev, customerName: e.target.value }))}
                                  placeholder={language === 'ar' ? 'اسمك' : 'Your name'}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                                </label>
                                <Input
                                  value={reviewForm.customerEmail ?? ''}
                                  onChange={(e) => setReviewForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                                  placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                                />
                              </div>
                            </div>
                          ) : null}

                          <div>
                            <Textarea
                              value={reviewForm.content ?? ''}
                              onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                              rows={4}
                              placeholder={language === 'ar' ? 'تعليق اختياري' : 'Optional comment'}
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
                                {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                              </span>
                            ) : (
                              <>{language === 'ar' ? 'إرسال المراجعة' : 'Submit review'}</>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
