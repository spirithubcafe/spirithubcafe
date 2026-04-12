import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Coffee, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { ProductCard } from '../components/products/ProductCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

export const ProductsPage = () => {
  const { i18n } = useTranslation();
  const { products, allCategories, loading, language } = useApp();
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

  const isArabic = i18n.language === 'ar';

  // AppContext already fetches with excludeShop: true,
  // so products and allCategories are already filtered.
  const coffeeCategories = allCategories;
  const coffeeProducts = products;

  const canonicalUrl = useMemo(() => {
    const suffix = categoryFromUrl ? `?category=${categoryFromUrl}` : '';
    return `${siteMetadata.baseUrl}/products${suffix}`;
  }, [categoryFromUrl]);

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

  // Scroll to top on page load or category change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  // Filter products
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const activeCategoryId =
      currentCategory?.id ??
      (selectedCategory !== 'all' && /^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategorySlug =
      currentCategory?.slug ??
      (selectedCategory !== 'all' && !/^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategoryName = currentCategory?.name
      ? currentCategory.name.trim().toLowerCase()
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
          product.category &&
          product.category.trim().toLowerCase() === activeCategoryName);

      if (!matchesCategory) {
        return false;
      }

      // Filter by search term
      if (normalizedSearch === '') {
        return true;
      }

      const searchableText = `${product.name} ${product.description || ''} ${product.category || ''}`;
      return searchableText.toLowerCase().includes(normalizedSearch);
    });
  }, [coffeeProducts, searchTerm, selectedCategory, currentCategory]);

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

    // Sort categories by their displayOrder
    const sortedCategories = coffeeCategories
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(cat => ({
        category: cat,
        products: grouped.get(cat.id) || []
      }))
      .filter(item => item.products.length > 0);

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
            title: `اشتري ${currentCategory.name} | قهوة مختصة SpiritHub عمان والسعودية`,
            description: `اطلب ${currentCategory.name} من محمصة SpiritHub. قهوة مختصة محمصة طازجة، كبسولات، توصيل سريع في مسقط والخبر. اشتري الآن حبوب قهوة فاخرة.`,
          }
        : {
            title: `Buy ${currentCategory.name} | Specialty Coffee SpiritHub Oman & Saudi`,
            description: `Order ${currentCategory.name} from SpiritHub Roastery. Fresh roasted specialty coffee, capsules, fast delivery in Muscat & Khobar. Buy premium coffee beans online now.`,
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
  }, [currentCategory, language, selectedCategory]);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      url: canonicalUrl,
      name: seoContent.title,
      description: seoContent.description,
      inLanguage: language === 'ar' ? 'ar' : 'en',
      numberOfItems: filteredProducts.length,
    }),
    [canonicalUrl, filteredProducts.length, language, seoContent.description, seoContent.title]
  );

  // Category options
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const allOption: CategoryOption = {
      id: 'all',
      name: isArabic ? 'جميع المنتجات' : 'All Products',
    };

    const mappedCategories = coffeeCategories.map<CategoryOption>((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

    return [allOption, ...mappedCategories];
  }, [coffeeCategories, isArabic]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      <AnnouncementBar />
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
          currentCategory?.name || 'Spirit Hub Cafe products',
          'قهوة مختصة مسقط',
          'شراء قهوة عمان',
          'محمصة قهوة',
        ]}
        canonical={canonicalUrl}
        structuredData={structuredData}
        type="website"
      />
      {/* Page Header */}
      <PageHeader
        title={currentCategory && selectedCategory !== 'all' 
          ? currentCategory.name 
          : 'Our Products'
        }
        titleAr={currentCategory && selectedCategory !== 'all' 
          ? currentCategory.name 
          : 'منتجاتنا'
        }
        subtitle={currentCategory && selectedCategory !== 'all'
          ? currentCategory.description 
          : 'Discover our premium collection of carefully crafted coffee and desserts'
        }
        subtitleAr={currentCategory && selectedCategory !== 'all'
          ? currentCategory.description 
          : 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
        }
      />

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
                        onPointerDown={(e) => { e.preventDefault(); handleCategoryChange(category.id); setCategoryOpen(false); }}
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
            {loading ? (
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
                {selectedCategory === 'all' && productsByCategory ? (
                  <div className="space-y-16">
                    {productsByCategory.map(({ category, products: categoryProducts }) => {
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
                        <div key={category.id} className="space-y-6">
                          {/* Category Section Header */}
                          <div className="flex items-center gap-4 pb-4 border-b-2 border-amber-500">
                            <div className="flex items-center gap-4 flex-1">
                              {category.image && category.id !== 'uncategorized' && (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-16 h-16 rounded-lg object-cover shadow-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                  {getShortName(category.name)}
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
                            {categoryProducts.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Single category view - standard grid */
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* All Categories Section */}
      <div className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isArabic ? 'تصفح جميع الفئات' : 'BROWSE ALL CATEGORIES'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto items-stretch">
            {coffeeCategories.map((category) => {
              const isActive = selectedCategory === category.id || selectedCategory === category.slug;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className="group w-full h-full cursor-pointer text-left transition-all"
                >
                  <div className={`h-full overflow-hidden rounded-2xl border bg-white transition-all duration-300 flex flex-col ${
                    isActive
                      ? 'border-amber-500 shadow-md'
                      : 'border-gray-200 group-hover:border-gray-300'
                  }`}>
                    {/* Category Image */}
                    <div className="relative overflow-hidden aspect-square">
                      <img
                        src={category.image || '/images/slides/slide1.webp'}
                        alt={category.name}
                        width={200}
                        height={200}
                        loading="eager"
                        decoding="sync"
                        fetchPriority="high"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/slides/slide1.webp';
                        }}
                      />

                      {/* Overlay on Hover */}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        isActive
                          ? 'bg-amber-500/10'
                          : 'bg-black/0 group-hover:bg-black/5'
                      }`} />
                    </div>

                    {/* Category Name */}
                    <div className="flex min-h-[86px] items-center bg-gray-50 px-4 py-4 sm:px-5">
                      <h3 className={`text-[1.05rem] font-semibold leading-6 transition-colors duration-200 ${
                        isActive
                          ? 'text-amber-600'
                          : 'text-gray-900 group-hover:text-amber-600'
                      }`}>
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div> {/* End Content Container */}
    </div>
  );
};
