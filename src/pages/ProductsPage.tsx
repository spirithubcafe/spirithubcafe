import { useMemo, useState, useEffect } from 'react';
import { Coffee, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { ProductCard } from '../components/products/ProductCard';
import { Spinner } from '../components/ui/spinner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

export const ProductsPage = () => {
  const { i18n } = useTranslation();
  const { products, allCategories, loading } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const isArabic = i18n.language === 'ar';

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
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-[url('/images/slides/slide1.webp')] bg-cover bg-center opacity-20"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {currentCategory && selectedCategory !== 'all' 
                ? currentCategory.name 
                : (isArabic ? 'منتجاتنا' : 'Our Products')
              }
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed drop-shadow-md">
              {currentCategory && selectedCategory !== 'all'
                ? currentCategory.description 
                : (isArabic
                    ? 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
                    : 'Discover our premium collection of carefully crafted coffee and desserts')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section - Compact & Professional */}
      <div className="py-3 bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 shadow-xl border-b border-stone-700/50 sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Single Row Compact Layout */}
            <div className="flex flex-row gap-2.5 items-center">
              {/* Search Box - Compact & Sleek */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 ltr:left-3 rtl:right-3 pointer-events-none z-10">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={isArabic ? 'البحث...' : 'Search...'}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`w-full py-2.5 px-3 border-0 rounded-lg focus:ring-2 focus:ring-stone-600 transition-all bg-stone-800/80 backdrop-blur-sm text-sm font-medium text-white placeholder:text-stone-500 shadow-sm hover:bg-stone-800 ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                  aria-label={isArabic ? 'بحث المنتجات' : 'Search products'}
                />
              </div>

              {/* Category Select - Shadcn UI */}
              <div className="relative flex items-center gap-2">
                <Filter className="w-5 h-5 text-stone-400" />
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[160px] sm:w-[220px] h-10 bg-stone-800/80 border-0 text-stone-100 text-base font-semibold shadow-sm hover:bg-stone-700/80 backdrop-blur-sm">
                    <SelectValue placeholder={isArabic ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700 text-white z-50">
                    {categoryOptions.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-base font-medium text-white hover:bg-stone-600/50 focus:bg-stone-600/60 data-[state=checked]:bg-stone-600 cursor-pointer py-2.5"
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

              {/* Products Grid - 4 products per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Categories Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isArabic ? 'تصفح جميع الفئات' : 'Browse All Categories'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {isArabic 
                ? 'اكتشف مجموعتنا الكاملة من القهوة والمنتجات المتخصصة' 
                : 'Discover our complete collection of coffee and specialty products'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {allCategories.map((category) => {
              const isActive = selectedCategory === category.id || selectedCategory === category.slug;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`group cursor-pointer text-left transition-all ${
                    isActive ? 'ring-2 ring-amber-500' : ''
                  }`}
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
    </div>
  );
};
