import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Coffee, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { ProductCard } from '../components/products/ProductCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { useShopPage } from '../hooks/useShop';
import { useRegion } from '../hooks/useRegion';
import { getCategoryImageUrl } from '../lib/imageUtils';

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

const GIFT_HINT_EN = '❤️ Gift Someone Special';
const GIFT_HINT_AR = '❤️ أهدي شخص مميز';
const LIMITED_HINT_EN = '✨ Limited Release';
const LIMITED_HINT_AR = '✨ إصدار محدود';

const isGiftOrBundleCategory = (name: string, hrefOrSlug: string): boolean => {
  const haystack = `${name} ${hrefOrSlug}`.toLowerCase();
  return (
    haystack.includes('bundle') ||
    haystack.includes('gift') ||
    haystack.includes('هدية') ||
    haystack.includes('هدايا') ||
    haystack.includes('أهدي')
  );
};

const isCompetitionPremiumCategory = (name: string, hrefOrSlug: string): boolean => {
  const haystack = `${name} ${hrefOrSlug}`.toLowerCase();
  return (
    haystack.includes('competition premium') ||
    haystack.includes('premium series') ||
    haystack.includes('series') ||
    haystack.includes('منافسة') ||
    haystack.includes('محدود')
  );
};

// Cache for category order to avoid repeated string normalization
const categoryOrderCache = new Map<string, number>();

const getPreferredCategoryOrder = (name: string): number => {
  if (categoryOrderCache.has(name)) {
    return categoryOrderCache.get(name)!;
  }

  const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
  let order = 1000;

  if (normalizedName.includes('espresso') && normalizedName.includes('milk-based')) order = 0;
  else if (normalizedName.includes('filter') && normalizedName.includes('pour-over')) order = 10;
  else if (normalizedName.includes('competition') && normalizedName.includes('premium')) order = 20;
  else if (normalizedName.includes('ufo') && normalizedName.includes('drip')) order = 30;
  else if (normalizedName.includes('spirithub') && normalizedName.includes('capsule')) order = 40;

  categoryOrderCache.set(name, order);
  return order;
};

const DeferredProductGroup = ({
  children,
  eager,
  productCount,
}: {
  children: ReactNode;
  eager: boolean;
  productCount: number;
}) => {
  const [shouldRender, setShouldRender] = useState(eager);
  const groupRef = useRef<HTMLDivElement>(null);
  const canRender = eager || shouldRender;

  useEffect(() => {
    if (canRender) return;

    const group = groupRef.current;
    if (!group || !('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      {
        rootMargin: window.matchMedia('(max-width: 767px)').matches
          ? '100px 0px'
          : '900px 0px',
      },
    );

    observer.observe(group);
    return () => observer.disconnect();
  }, [canRender]);

  const placeholderStyle = {
    '--product-count': Math.max(productCount, 1),
  } as CSSProperties;

  return (
    <div ref={groupRef} className="products-product-group space-y-6">
      {canRender ? (
        children
      ) : (
        <div
          className="products-product-group-placeholder"
          style={placeholderStyle}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

interface ProductsPageProps {
  hidePageChrome?: boolean;
}

export const ProductsPage = ({ hidePageChrome = false }: ProductsPageProps) => {
  const { i18n } = useTranslation();
  const {
    products,
    allCategories,
    loading,
    language,
    fetchProducts,
    fetchCategories,
  } = useApp();
  const { currentRegion } = useRegion();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Preserve the region prefix (/om or /sa) so navigate() stays on the same
  // route instance and never causes a ProductsPage remount.
  const regionPrefix = pathname.startsWith('/sa') ? '/sa' : '/om';
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);
  const [shouldLoadShopCategories, setShouldLoadShopCategories] = useState(false);
  const browseCategoriesSectionRef = useRef<HTMLDivElement>(null);
  const browseCategoriesRef = useRef<HTMLDivElement>(null);
  const { shopData } = useShopPage(shouldLoadShopCategories);

  const isArabic = i18n.language === 'ar';
  const getCategoryDisplayName = useCallback(
    (category: { name: string; nameAr?: string }) =>
      isArabic ? category.nameAr || category.name : category.name,
    [isArabic],
  );

  const coffeeProducts = products;
  const isProductsLoading = loading && coffeeProducts.length === 0;

  // Homepage data loading is intentionally deferred. If the user navigates
  // here before that work starts, request the missing route data immediately.
  useEffect(() => {
    if (products.length === 0) {
      void fetchProducts();
    }
    if (allCategories.length === 0) {
      void fetchCategories();
    }
  }, [allCategories.length, fetchCategories, fetchProducts, products.length]);

  // Keep filters usable when the categories request is delayed or unavailable.
  // Product list responses already include enough category data to build a fallback.
  const coffeeCategories = useMemo(() => {
    const mergedCategories = new Map(
      allCategories.map((category) => [category.id, category] as const),
    );

    coffeeProducts.forEach((product, index) => {
      const categoryName = (isArabic ? product.categoryAr || product.category : product.category)?.trim();
      const categoryId = product.categoryId || product.categorySlug || categoryName;
      if (!categoryName || !categoryId || mergedCategories.has(categoryId)) return;

      mergedCategories.set(categoryId, {
        id: categoryId,
        slug: product.categorySlug,
        name: product.category || categoryName,
        nameAr: product.categoryAr,
        description: '',
        image: product.image || '',
        displayOrder: allCategories.length > 0
          ? 1000 + index
          : index,
      });
    });

    return [...mergedCategories.values()].sort((a, b) => {
      // Build sort keys once per comparison
      const aKey = `${a.name} ${a.slug || ''}`;
      const bKey = `${b.name} ${b.slug || ''}`;

      const preferredOrderDifference =
        getPreferredCategoryOrder(aKey) -
        getPreferredCategoryOrder(bKey);

      if (preferredOrderDifference !== 0) return preferredOrderDifference;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [allCategories, coffeeProducts, isArabic]);

  const canonicalUrl = useMemo(() => {
    // Use region-prefixed URL: /om for Oman (canonical), no prefix for SA
    const regionPath = regionPrefix === '/sa' ? '' : '/om';
    // Canonical URL never includes category query params (avoid duplicate content)
    return `${siteMetadata.baseUrl}${regionPath}/products`;
  }, [regionPrefix]);

  // Handle category change and update URL
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      navigate(`${regionPrefix}/products`, { replace: true });
    } else {
      navigate(`${regionPrefix}/products?category=${categoryId}`, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update selected category when URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory('all');
    }
    // NOTE: no scroll-to-top here — that would scroll the sticky filter bar
    // off-screen whenever a category is selected.
  }, [categoryFromUrl]);

  // Normalize selected category to a known category ID when allCategories change
  useEffect(() => {
    if (selectedCategory === 'all') {
      return;
    }

    const matchBySlug = coffeeCategories.find((cat) => cat.slug === selectedCategory);
    if (matchBySlug && selectedCategory !== matchBySlug.id) {
      setSelectedCategory(matchBySlug.id);
    }
  }, [coffeeCategories, selectedCategory]);

  // Get current category details
  const currentCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return null;
    }

    return (
      coffeeCategories.find((cat) => cat.id === selectedCategory) ||
      coffeeCategories.find((cat) => cat.slug === selectedCategory) ||
      null
    );
  }, [selectedCategory, coffeeCategories]);
  const currentCategoryDisplayName = currentCategory
    ? getCategoryDisplayName(currentCategory)
    : '';

  // Filter products
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const activeCategoryId =
      currentCategory?.id ??
      (selectedCategory !== 'all' && /^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategorySlug =
      currentCategory?.slug ??
      (selectedCategory !== 'all' && !/^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategoryName = currentCategory
      ? getCategoryDisplayName(currentCategory).trim().toLowerCase()
      : null;

    return coffeeProducts.filter((product) => {
      // Business rule: never show inactive products publicly.
      if (product.isActive === false) {
        return false;
      }

      // If the product has no active variants, it should not appear in the listing.
      if (product.isOrderable === false) {
        return false;
      }

      // Filter by category using categoryId when available
      const matchesCategory =
        selectedCategory === 'all' ||
        (activeCategoryId && product.categoryId === activeCategoryId) ||
        (activeCategorySlug && product.categorySlug === activeCategorySlug) ||
        (activeCategoryName &&
          ((product.category && product.category.trim().toLowerCase() === activeCategoryName) ||
            (product.categoryAr && product.categoryAr.trim().toLowerCase() === activeCategoryName)));

      if (!matchesCategory) {
        return false;
      }

      // Filter by search term - use pre-built searchable text to avoid concatenation
      if (normalizedSearch === '') {
        return true;
      }

      const searchableText = product._searchText ||
        `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [coffeeProducts, searchTerm, selectedCategory, currentCategory, getCategoryDisplayName]);

  // Group products by category when "All" is selected
  const productsByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return null;
    }

    const grouped = new Map<string, typeof filteredProducts>();
    
    filteredProducts.forEach((product) => {
      const categoryId = product.categoryId || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(product);
    });

    // coffeeCategories is already normalized into the preferred storefront order.
    // Do not sort by displayOrder again: fallback categories derive that value from
    // product arrival order, which can differ on a cold/Incognito request.
    const sortedCategories = coffeeCategories
      .map(cat => ({
        category: cat,
        products: grouped.get(cat.id) || []
      }))
      .filter(item => item.products.length > 0);

    const matchedCategoryIds = new Set(sortedCategories.map(({ category }) => category.id));

    // Keep products visible when category metadata is missing or stale.
    grouped.forEach((categoryProducts, categoryId) => {
      if (categoryId === 'uncategorized' || matchedCategoryIds.has(categoryId)) {
        return;
      }

      const firstProduct = categoryProducts[0];
      sortedCategories.push({
        category: {
          id: categoryId,
          name: firstProduct?.category || 'Uncategorized',
          nameAr: firstProduct?.categoryAr,
          slug: firstProduct?.categorySlug,
          description: '',
          image: '',
        },
        products: categoryProducts,
      });
    });

    // Add uncategorized products if any
    const uncategorized = grouped.get('uncategorized');
    if (uncategorized && uncategorized.length > 0) {
      sortedCategories.push({
        category: {
          id: 'uncategorized',
          name: isArabic ? 'غير مصنف' : 'Uncategorized',
          slug: 'uncategorized',
          description: '',
          image: '',
        },
        products: uncategorized
      });
    }

    return sortedCategories;
  }, [selectedCategory, filteredProducts, coffeeCategories, isArabic]);

  const seoContent = useMemo(() => {
    if (currentCategory && selectedCategory !== 'all') {
      return language === 'ar'
        ? {
            title: `اشتري ${currentCategoryDisplayName} | قهوة مختصة SpiritHub عمان والسعودية`,
            description: `اطلب ${currentCategoryDisplayName} من محمصة SpiritHub. قهوة مختصة محمصة طازجة، كبسولات، توصيل سريع في مسقط والخبر. اشتري الآن حبوب قهوة فاخرة.`,
          }
        : {
            title: `Buy ${currentCategoryDisplayName} | Specialty Coffee SpiritHub Oman & Saudi`,
            description: `Order ${currentCategoryDisplayName} from SpiritHub Roastery. Fresh roasted specialty coffee, capsules, fast delivery in Muscat & Khobar. Buy premium coffee beans online now.`,
          };
    }
    return language === 'ar'
      ? {
          title: 'اشتري قهوة مختصة وكبسولات | محمصة SpiritHub عمان والسعودية',
          description: 'اطلب الآن: حبوب قهوة مختصة محمصة طازجة، كبسولات متوافقة، معدات تحضير احترافية. توصيل سريع في مسقط عمان والخبر السعودية. محمصة متخصصة.',
        }
      : {
          title: 'Buy Specialty Coffee & Capsules | SpiritHub Roastery Oman & Saudi',
          description: 'Order now: fresh roasted specialty coffee beans, compatible capsules, professional brewing equipment. Fast delivery in Muscat Oman and Khobar Saudi Arabia. Expert roastery.',
        };
  }, [currentCategory, currentCategoryDisplayName, language, selectedCategory]);

  const structuredData = useMemo(() => {
    const regionPath = regionPrefix === '/sa' ? '' : '/om';
    const homeUrl = `${siteMetadata.baseUrl}${regionPath}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: language === 'ar' ? 'الرئيسية' : 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: language === 'ar' ? 'المنتجات' : 'Products', item: canonicalUrl },
          ...(currentCategory?.name
            ? [{ '@type': 'ListItem' as const, position: 3, name: currentCategoryDisplayName, item: canonicalUrl }]
            : []),
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        url: canonicalUrl,
        name: seoContent.title,
        description: seoContent.description,
        inLanguage: language === 'ar' ? 'ar' : 'en',
        numberOfItems: filteredProducts.length,
        publisher: {
          '@type': 'Organization',
          name: 'Spirit Hub Cafe',
          url: siteMetadata.baseUrl,
        },
      },
    ];
  }, [canonicalUrl, filteredProducts.length, language, seoContent.description, seoContent.title, regionPrefix, currentCategory, currentCategoryDisplayName]);

  // Category options
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const allOption: CategoryOption = {
      id: 'all',
      name: isArabic ? 'جميع المنتجات' : 'All Products',
    };

    const mappedCategories = coffeeCategories.map<CategoryOption>((category) => ({
      id: category.id,
      name: getCategoryDisplayName(category),
      slug: category.slug,
    }));

    return [allOption, ...mappedCategories];
  }, [coffeeCategories, getCategoryDisplayName, isArabic]);

  const browseCoffeeCategories = useMemo(
    () => [...allCategories].sort((a, b) => {
      const preferredOrderDifference =
        getPreferredCategoryOrder(`${a.name} ${a.slug || ''}`) -
        getPreferredCategoryOrder(`${b.name} ${b.slug || ''}`);
      if (preferredOrderDifference !== 0) return preferredOrderDifference;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    }),
    [allCategories],
  );

  const browseCategories = useMemo(() => {
    // This visual carousel must use real category metadata. Product-derived
    // fallback categories use a product image, which would visibly swap once
    // the category request completes.
    const coffeeItems = browseCoffeeCategories.map((category) => ({
      id: `coffee-${category.id}`,
      name: getCategoryDisplayName(category),
      image: category.image || '/images/slides/slide1.webp',
      kind: 'coffee' as const,
      categoryId: category.id,
      categorySlug: category.slug,
      href: '',
    }));

    const shopItems = (shopData?.categories ?? []).map((category) => ({
      id: `shop-${category.id}`,
      name: isArabic ? category.nameAr || category.name : category.name,
      image: getCategoryImageUrl(category.imagePath),
      kind: 'shop' as const,
      categoryId: String(category.id),
      categorySlug: category.slug,
      href: `/${currentRegion.code}/shop/${category.slug}`,
    }));

    return [...coffeeItems, ...shopItems];
  }, [browseCoffeeCategories, currentRegion.code, getCategoryDisplayName, isArabic, shopData?.categories]);

  const renderedBrowseCategories = useMemo(
    () => browseCategories,
    [browseCategories],
  );

  useEffect(() => {
    const section = browseCategoriesSectionRef.current;
    if (!section || shouldLoadShopCategories) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoadShopCategories(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoadShopCategories(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoadShopCategories]);

  const updateBrowseCategoryArrows = useCallback(() => {
    const viewport = browseCategoriesRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    setCanScrollCategoriesLeft(viewport.scrollLeft > 1);
    setCanScrollCategoriesRight(viewport.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const viewport = browseCategoriesRef.current;
    if (!viewport || !window.matchMedia('(min-width: 768px)').matches) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    const scheduleArrowUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateBrowseCategoryArrows();
      });
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        intersectionObserver.disconnect();
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = 0;
          if (isArabic) {
            viewport.scrollLeft = viewport.scrollWidth;
          }
          updateBrowseCategoryArrows();
        });

        resizeObserver = new ResizeObserver(scheduleArrowUpdate);
        resizeObserver.observe(viewport);
      },
      { rootMargin: '300px 0px' },
    );

    intersectionObserver.observe(viewport);
    viewport.addEventListener('scroll', scheduleArrowUpdate, { passive: true });

    return () => {
      intersectionObserver.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      viewport.removeEventListener('scroll', scheduleArrowUpdate);
      resizeObserver?.disconnect();
    };
  }, [isArabic, renderedBrowseCategories.length, updateBrowseCategoryArrows]);

  const scrollBrowseCategories = useCallback((direction: 'left' | 'right') => {
    const viewport = browseCategoriesRef.current;
    if (!viewport) return;

    viewport.scrollBy({
      left: direction === 'left' ? -viewport.clientWidth * 0.8 : viewport.clientWidth * 0.8,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      {!hidePageChrome && <AnnouncementBar />}
      <Seo
        title={seoContent.title}
        description={seoContent.description}
        keywords={[
          'specialty coffee Muscat',
          'buy coffee beans Oman',
          'fresh roasted coffee',
          'coffee roastery Muscat',
          'Nespresso capsules Oman',
          'brewing equipment',
          'single origin coffee',
          'coffee shop online Oman',
          currentCategoryDisplayName || 'Spirit Hub Cafe products',
          'قهوة مختصة مسقط',
          'شراء قهوة عمان',
          'محمصة قهوة',
        ]}
        canonical={canonicalUrl}
        structuredData={structuredData}
        type="website"
      />
      {/* Page Header */}
      {!hidePageChrome && (
        <PageHeader
          variant="products"
          title={currentCategory && selectedCategory !== 'all'
            ? currentCategoryDisplayName
            : 'Shop Specialty Coffee'
          }
          titleAr={currentCategory && selectedCategory !== 'all'
            ? currentCategoryDisplayName
            : 'منتجاتنا'
          }
          subtitle={currentCategory && selectedCategory !== 'all'
            ? (isArabic ? currentCategory.descriptionAr || currentCategory.description : currentCategory.description)
            : 'Freshly roasted in Oman & Saudi Arabia'
          }
          subtitleAr={currentCategory && selectedCategory !== 'all'
            ? (currentCategory.descriptionAr || currentCategory.description)
            : 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
          }
        />
      )}

      {/* Content Container - Sticky context */}
      <div className="relative">
        {/* Filters Section - Compact & Professional */}
        <div 
          className="sticky-filter-bar bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 shadow-xl border-b border-stone-700/50 flex items-center"
        >
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="max-w-6xl mx-auto w-full">
              {/* Single Row Compact Layout */}
              <div className="flex flex-row gap-3 items-center">
              {/* Search Box - Compact & Sleek */}
              <div className="relative flex-1 min-w-0 max-w-md">
                <div className="absolute top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 ltr:left-2.5 rtl:right-2.5 pointer-events-none z-10">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={isArabic ? 'البحث...' : 'Search...'}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`w-full h-9 py-2 px-2.5 border-0 rounded-lg focus:ring-2 focus:ring-stone-600 transition-all bg-stone-800/80 backdrop-blur-sm text-sm font-medium text-white placeholder:text-stone-500 shadow-sm hover:bg-stone-800 ${isArabic ? 'pr-9 pl-2.5' : 'pl-9 pr-2.5'}`}
                  aria-label={isArabic ? 'بحث المنتجات' : 'Search products'}
                />
              </div>

              {/* Category Dropdown - Popover-based, no scroll lock */}
              <div className="relative flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4 text-stone-400 shrink-0" />
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={`flex items-center gap-2 h-9 w-auto min-w-[100px] max-w-[160px] xs:max-w-[180px] sm:max-w-[240px] rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 text-sm font-semibold px-3 border-0 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-stone-600 ${isArabic ? 'flex-row-reverse' : ''}`}
                      aria-label={isArabic ? 'فئة المنتج' : 'Product category'}
                    >
                      <span className={`flex-1 truncate ${isArabic ? 'text-right' : 'text-left'}`}>
                        {categoryOptions.find(c => c.id === selectedCategory)?.name ?? (isArabic ? 'جميع المنتجات' : 'All Products')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align={isArabic ? 'end' : 'start'}
                    sideOffset={6}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-64 p-1 bg-stone-900 border border-stone-700 shadow-xl rounded-xl z-[200]"
                  >
                    {categoryOptions.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          handleCategoryChange(category.id);
                          setCategoryOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-stone-700 text-white'
                            : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                        } ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <span className={`flex-1 truncate ${isArabic ? 'text-right' : 'text-left'}`}>{category.name}</span>
                        {selectedCategory === category.id && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isProductsLoading ? (
              <div className="space-y-8">
                {/* Results Count Skeleton */}
                <div className="flex justify-center">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                </div>
                {/* Product Cards Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                      <div className="aspect-square w-full animate-pulse bg-gray-100" />
                      <div className="space-y-2.5 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                        <div className="h-5 w-24 animate-pulse rounded-md bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {isArabic ? 'لم يتم العثور على منتجات' : 'No products found'}
                </h3>
                <p className="text-gray-500">
                  {isArabic
                    ? 'جرب تغيير فلاتر البحث'
                    : 'Try changing your search filters'}
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-8 text-center">
                  <p className="text-gray-600">
                    {isArabic ? (
                      <>
                        <span className="font-semibold text-amber-600">{filteredProducts.length}</span>
                        {' منتج متاح'}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-amber-600">{filteredProducts.length}</span>
                        {' products available'}
                      </>
                    )}
                  </p>
                </div>

                {/* Show grouped by category if "All" is selected */}
                {selectedCategory === 'all' && productsByCategory && productsByCategory.length > 0 ? (
                  <div className="space-y-16">
                    {productsByCategory.map(({ category, products: categoryProducts }, categoryIndex) => {
                      const categoryDisplayName = getCategoryDisplayName(category);
                      // Shorten category names
                      const getShortName = (name: string) => {
                        const shortNames: Record<string, string> = {
                          'Espresso Coffee': 'Espresso',
                          'Coffee Capsules': 'Capsules',
                          'Premium Coffee': 'Premium',
                          'Filter Coffee': 'Filter',
                          'Drip Coffee': 'Drip',
                        };
                        return shortNames[name] || name;
                      };

                      return (
                        <DeferredProductGroup
                          key={category.id}
                          eager={categoryIndex === 0}
                          productCount={categoryProducts.length}
                        >
                          {/* Category Section Header */}
                          <div className="flex items-center gap-4 pb-4 border-b-2 border-amber-500">
                            <div className="flex items-center gap-4 flex-1">
                              {category.image && category.id !== 'uncategorized' && (
                                <img
                                  src={category.image}
                                  alt={categoryDisplayName}
                                  width={64}
                                  height={64}
                                  loading="lazy"
                                  fetchPriority="low"
                                  decoding="async"
                                  className="w-16 h-16 rounded-lg object-cover shadow-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                  {getShortName(categoryDisplayName)}
                                </h2>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCategoryChange(category.id)}
                              className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              {isArabic ? 'عرض الكل' : 'View All'}
                            </button>
                          </div>

                          {/* Category Products Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {categoryProducts.map((product, productIndex) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                prioritizeImage={categoryIndex === 0 && productIndex < 2}
                              />
                            ))}
                          </div>
                        </DeferredProductGroup>
                      );
                    })}
                  </div>
                ) : (
                  /* Single category view - standard grid */
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map((product, productIndex) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        prioritizeImage={productIndex < 2}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* All Categories Section */}
      <div ref={browseCategoriesSectionRef} className="products-categories-section bg-[#fbfbf9] py-8">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isArabic ? 'تصفح جميع الفئات' : 'BROWSE ALL CATEGORIES'}
            </h2>
          </div>

          <div className="relative mx-auto max-w-[1320px]">
            <div className="products-category-edge products-category-edge-left" />
            <div className="products-category-edge products-category-edge-right" />

            <button
              type="button"
              aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
              onClick={() => scrollBrowseCategories('left')}
              disabled={!canScrollCategoriesLeft}
              className="products-category-nav products-category-nav-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
              onClick={() => scrollBrowseCategories('right')}
              disabled={!canScrollCategoriesRight}
              className="products-category-nav products-category-nav-right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div ref={browseCategoriesRef} dir="ltr" className="products-category-viewport overflow-x-auto">
              <div className={`products-category-track flex pb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {renderedBrowseCategories.map((category) => {
              const isActive = category.kind === 'coffee' && (selectedCategory === category.categoryId || selectedCategory === category.categorySlug);
              const cardClassName = 'products-category-slide group block min-w-0 shrink-0 h-full cursor-pointer text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60';
              const cardBody = (
                <div className={`h-full overflow-hidden rounded-2xl border bg-[#fffdf9] shadow-[0_10px_30px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(0,0,0,0.075)] ${
                  isActive
                    ? 'border-amber-500 shadow-md'
                    : 'border-[#dfe4dd] group-hover:border-[#d2d8d1]'
                }`}>
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <img
                      src={category.image}
                      alt={category.name}
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/slides/slide1.webp';
                      }}
                    />

                    <div className={`absolute inset-0 transition-all duration-300 ${
                      isActive
                        ? 'bg-amber-500/10'
                        : 'bg-black/0 group-hover:bg-black/5'
                    }`} />
                  </div>

                  <div className="flex min-h-[84px] flex-col justify-center bg-[#fffdf9] px-3.5 py-3">
                    <h3
                      dir={isArabic ? 'rtl' : 'ltr'}
                      className={`w-full truncate whitespace-nowrap text-[0.98rem] font-semibold leading-7 tracking-tight transition-colors duration-200 ${isArabic ? 'text-right pe-1' : 'text-center'} ${
                      isActive
                        ? 'text-amber-600'
                        : 'text-gray-900 group-hover:text-amber-600'
                      }`}
                    >
                      {category.name}
                    </h3>
                    {isCompetitionPremiumCategory(category.name, category.href || category.categorySlug || '') ? (
                      <p
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className={`mt-1 w-full truncate whitespace-nowrap text-[0.72rem] font-semibold leading-4 text-rose-600 ${isArabic ? 'text-right pe-1' : 'text-center'}`}
                      >
                        {isArabic ? LIMITED_HINT_AR : LIMITED_HINT_EN}
                      </p>
                    ) : null}
                    {!isCompetitionPremiumCategory(category.name, category.href || category.categorySlug || '') &&
                    isGiftOrBundleCategory(category.name, category.href || category.categorySlug || '') ? (
                      <p
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className={`mt-1 w-full truncate whitespace-nowrap text-[0.72rem] font-semibold leading-4 text-rose-600 ${isArabic ? 'text-right pe-1' : 'text-center'}`}
                      >
                        {isArabic ? GIFT_HINT_AR : GIFT_HINT_EN}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
              
              if (category.kind === 'shop') {
                return (
                  <Link key={category.id} to={category.href} className={cardClassName}>
                    {cardBody}
                  </Link>
                );
              }

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.categoryId)}
                  className={cardClassName}
                >
                  {cardBody}
                </button>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .products-category-viewport {
          cursor: grab;
          scrollbar-width: none;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          overscroll-behavior-inline: contain;
          -webkit-overflow-scrolling: touch;
        }

        .products-category-viewport::-webkit-scrollbar {
          display: none;
        }

        .products-category-viewport:active {
          cursor: grabbing;
        }

        .products-category-track {
          direction: ltr;
          margin-left: -12px;
        }

        .products-category-slide {
          flex: 0 0 min(58vw, 212px);
          margin-left: 12px;
          scroll-snap-align: start;
        }

        .products-categories-section {
          content-visibility: auto;
          contain-intrinsic-size: auto 420px;
        }

        .products-product-group {
          content-visibility: auto;
          contain-intrinsic-size: auto 620px;
        }

        .products-product-group-placeholder {
          min-height: calc(120px + var(--product-count) * 215px);
        }

        .products-category-edge {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10;
          display: none;
          height: 100%;
          width: 26px;
        }

        .products-category-edge-left {
          left: 0;
          background: linear-gradient(90deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .products-category-edge-right {
          right: 0;
          background: linear-gradient(270deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .products-category-nav {
          position: absolute;
          top: 50%;
          z-index: 20;
          display: none;
          height: 36px;
          width: 36px;
          transform: translateY(-50%);
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(77, 91, 84, 0.14);
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.88);
          color: #4b5a58;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }

        .products-category-nav:not(:disabled):hover {
          background: #fffdf9;
          transform: translateY(-50%) scale(1.04);
        }

        .products-category-nav:disabled {
          opacity: 0.34;
          cursor: not-allowed;
        }

        .products-category-nav-left {
          left: 8px;
        }

        .products-category-nav-right {
          right: 8px;
        }

        @media (min-width: 640px) {
          .products-category-track {
            margin-left: -14px;
          }

          .products-category-slide {
            flex-basis: 212px;
            margin-left: 14px;
          }
        }

        @media (min-width: 768px) {
          .products-product-group-placeholder {
            min-height: calc(120px + var(--product-count) * 150px);
          }

          .products-category-edge,
          .products-category-nav {
            display: flex;
          }
        }

        @media (min-width: 1024px) {
          .products-product-group-placeholder {
            min-height: calc(120px + var(--product-count) * 115px);
          }
        }
      `}</style>
      </div> {/* End Content Container */}
    </div>
  );
};
