import { useMemo, useState, useEffect } from 'react';
import { Coffee, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { ProductCard } from '../components/products/ProductCard';
import { Spinner } from '../components/ui/spinner';
import { PageHeader } from '../components/layout/PageHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

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
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const isArabic = i18n.language === 'ar';
  const canonicalUrl = useMemo(() => {
    const suffix = categoryFromUrl ? `?category=${categoryFromUrl}` : '';
    return `${siteMetadata.baseUrl}/products${suffix}`;
  }, [categoryFromUrl]);

  // Handle category change and update URL
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      navigate('/products', { replace: true });
    } else {
      navigate(`/products?category=${categoryId}`, { replace: true });
    }
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
    // Scroll to top when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryFromUrl]);

  // Normalize selected category to a known category ID when allCategories change
  useEffect(() => {
    if (selectedCategory === 'all') {
      return;
    }

    const matchBySlug = allCategories.find((cat) => cat.slug === selectedCategory);
    if (matchBySlug && selectedCategory !== matchBySlug.id) {
      setSelectedCategory(matchBySlug.id);
    }
  }, [allCategories, selectedCategory]);

  // Get current category details
  const currentCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return null;
    }

    return (
      allCategories.find((cat) => cat.id === selectedCategory) ||
      allCategories.find((cat) => cat.slug === selectedCategory) ||
      null
    );
  }, [selectedCategory, allCategories]);

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

    return products.filter((product) => {
      // Business rule: never show inactive products publicly.
      if (product.isActive === false) {
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
  }, [products, searchTerm, selectedCategory, currentCategory]);

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
    const sortedCategories = allCategories
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
  }, [selectedCategory, filteredProducts, allCategories, isArabic]);

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

    const mappedCategories = allCategories.map<CategoryOption>((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

    return [allOption, ...mappedCategories];
  }, [allCategories, isArabic]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
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
          className="sticky-filter-bar bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 shadow-xl border-b border-stone-700/50 backdrop-blur-lg flex items-center"
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

              {/* Category Select - Shadcn UI */}
              <div className="relative flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4 text-stone-400 shrink-0" />
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-36 sm:w-48 h-9 bg-stone-800/80 border-0 text-stone-100 text-sm font-semibold shadow-sm hover:bg-stone-700/80 backdrop-blur-sm">
                    <SelectValue placeholder={isArabic ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700 text-white z-50">
                    {categoryOptions.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-base font-medium text-white hover:bg-stone-600/50 focus:bg-stone-600/60 data-[state=checked]:bg-stone-600 cursor-pointer py-2.5 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="w-10 h-10" />
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
            {allCategories.map((category) => {
              const isActive = selectedCategory === category.id || selectedCategory === category.slug;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className="group cursor-pointer text-left transition-all"
                >
                  {/* Category Image */}
                  <div className={`relative overflow-hidden rounded-lg aspect-square mb-4 border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-amber-500 shadow-lg' 
                      : 'border-gray-200 group-hover:border-amber-400 group-hover:shadow-md'
                  }`}>
                    <img
                      src={category.image || '/images/slides/slide1.webp'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/slides/slide1.webp';
                      }}
                      loading="lazy"
                    />
                    
                    {/* Overlay on Hover */}
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      isActive 
                        ? 'bg-amber-500/20' 
                        : 'bg-black/0 group-hover:bg-black/10'
                    }`} />
                    
                    {/* Active Badge */}
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {isArabic ? 'محدد' : 'Active'}
                      </div>
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <div className="text-center">
                    <h3 className={`text-base font-bold transition-colors duration-200 ${
                      isActive 
                        ? 'text-amber-600' 
                        : 'text-gray-900 group-hover:text-amber-600'
                    }`}>
                      {category.name}
                    </h3>
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
