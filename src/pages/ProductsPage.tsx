import { useMemo, useState } from 'react';
import { Coffee, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { ProductCard } from '../components/products/ProductCard';
import { Spinner } from '../components/ui/spinner';

export const ProductsPage = () => {
  const { i18n } = useTranslation();
  const { products, loading } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isArabic = i18n.language === 'ar';

  // Filter products
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      // Filter by category
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

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
  }, [products, searchTerm, selectedCategory]);

  // Category options
  const categoryOptions = useMemo(() => {
    const allOption = {
      id: 'all',
      name: isArabic ? 'جميع المنتجات' : 'All Products',
    };

    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).map((cat) => ({
      id: cat,
      name: cat,
    }));

    return [allOption, ...uniqueCategories];
  }, [products, isArabic]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-[url('/images/slides/slide1.webp')] bg-cover bg-center opacity-20"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <Coffee className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {isArabic ? 'منتجاتنا' : 'Our Products'}
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed drop-shadow-md">
              {isArabic
                ? 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
                : 'Discover our premium collection of carefully crafted coffee and desserts'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="py-8 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ltr:left-3 rtl:right-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isArabic ? 'ابحث عن منتج...' : 'Search for a product...'}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  aria-label={isArabic ? 'بحث المنتجات' : 'Search products'}
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-amber-600" />
                {categoryOptions.map((category) => {
                  const isActive = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      type="button"
                    >
                      {category.name}
                    </button>
                  );
                })}
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

              {/* Products Grid - 2 products per row on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Categories Info Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {isArabic ? 'فئات مميزة' : 'Featured Categories'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {isArabic ? 'قهوة مختصة' : 'Specialty Coffee'}
              </h3>
              <p className="text-gray-600">
                {isArabic
                  ? 'مجموعة متنوعة من القهوة المحضرة بعناية من أجود الحبوب'
                  : 'Variety of carefully prepared coffee from the finest beans'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {isArabic ? 'حلويات طازجة' : 'Fresh Desserts'}
              </h3>
              <p className="text-gray-600">
                {isArabic
                  ? 'حلويات محضرة يومياً بأجود المكونات'
                  : 'Daily prepared desserts with the finest ingredients'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {isArabic ? 'معجنات مخبوزة' : 'Baked Pastries'}
              </h3>
              <p className="text-gray-600">
                {isArabic
                  ? 'معجنات طازجة مخبوزة يومياً في مخبزنا'
                  : 'Fresh pastries baked daily in our bakery'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
