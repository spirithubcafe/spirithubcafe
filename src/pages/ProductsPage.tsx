import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { Coffee, Star, Clock, ShoppingCart, Filter, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  image: string;
  category: string;
  categoryAr: string;
  rating: number;
  prepTime: string;
  prepTimeAr: string;
  featured: boolean;
  available: boolean;
}

export const ProductsPage: React.FC = () => {
  const { language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: language === 'ar' ? 'جميع المنتجات' : 'All Products' },
    { id: 'hot-coffee', name: language === 'ar' ? 'قهوة ساخنة' : 'Hot Coffee' },
    { id: 'cold-coffee', name: language === 'ar' ? 'قهوة باردة' : 'Cold Coffee' },
    { id: 'desserts', name: language === 'ar' ? 'حلويات' : 'Desserts' },
    { id: 'pastries', name: language === 'ar' ? 'معجنات' : 'Pastries' },
  ];

  const products: Product[] = [
    {
      id: 'espresso-premium',
      name: 'Premium Espresso',
      nameAr: 'إسبريسو مميز',
      description: 'Rich and concentrated espresso made from premium Arabic beans',
      descriptionAr: 'إسبريسو غني ومركز من حبوب القهوة العربية المميزة',
      price: 7.2,
      image: '/images/products/espresso.jpg',
      category: 'hot-coffee',
      categoryAr: 'قهوة ساخنة',
      rating: 4.8,
      prepTime: '3-5 min',
      prepTimeAr: '3-5 دقائق',
      featured: true,
      available: true,
    },
    {
      id: 'cappuccino-classic',
      name: 'Classic Cappuccino',
      nameAr: 'كابتشينو كلاسيكي',
      description: 'Perfect balance of espresso, steamed milk, and foam',
      descriptionAr: 'توازن مثالي بين الإسبريسو والحليب المبخر والرغوة',
      price: 8.8,
      image: '/images/products/cappuccino.jpg',
      category: 'hot-coffee',
      categoryAr: 'قهوة ساخنة',
      rating: 4.7,
      prepTime: '4-6 min',
      prepTimeAr: '4-6 دقائق',
      featured: true,
      available: true,
    },
    {
      id: 'latte-vanilla',
      name: 'Vanilla Latte',
      nameAr: 'لاتيه الفانيليا',
      description: 'Smooth latte with natural vanilla flavor',
      descriptionAr: 'لاتيه ناعم بنكهة الفانيليا الطبيعية',
      price: 10.0,
      image: '/images/products/vanilla-latte.jpg',
      category: 'hot-coffee',
      categoryAr: 'قهوة ساخنة',
      rating: 4.6,
      prepTime: '5-7 min',
      prepTimeAr: '5-7 دقائق',
      featured: false,
      available: true,
    },
    {
      id: 'frappuccino-cold',
      name: 'Cold Frappuccino',
      nameAr: 'فرابتشينو بارد',
      description: 'Refreshing blended coffee drink with ice',
      descriptionAr: 'مشروب قهوة منعش ممزوج بالثلج',
      price: 11.2,
      image: '/images/products/frappuccino.jpg',
      category: 'cold-coffee',
      categoryAr: 'قهوة باردة',
      rating: 4.5,
      prepTime: '6-8 min',
      prepTimeAr: '6-8 دقائق',
      featured: true,
      available: true,
    },
    {
      id: 'iced-americano',
      name: 'Iced Americano',
      nameAr: 'أمريكانو مثلج',
      description: 'Bold espresso shots with cold water and ice',
      descriptionAr: 'جرعات إسبريسو قوية مع الماء البارد والثلج',
      price: 8.0,
      image: '/images/products/iced-americano.jpg',
      category: 'cold-coffee',
      categoryAr: 'قهوة باردة',
      rating: 4.4,
      prepTime: '3-5 min',
      prepTimeAr: '3-5 دقائق',
      featured: false,
      available: true,
    },
    {
      id: 'tiramisu-cake',
      name: 'Tiramisu Cake',
      nameAr: 'كعكة التيراميسو',
      description: 'Classic Italian dessert with coffee-soaked layers',
      descriptionAr: 'حلوى إيطالية كلاسيكية بطبقات منقوعة بالقهوة',
      price: 14.0,
      image: '/images/products/tiramisu.jpg',
      category: 'desserts',
      categoryAr: 'حلويات',
      rating: 4.9,
      prepTime: '2-3 min',
      prepTimeAr: '2-3 دقائق',
      featured: true,
      available: true,
    },
    {
      id: 'chocolate-brownie',
      name: 'Chocolate Brownie',
      nameAr: 'براوني الشوكولاتة',
      description: 'Rich chocolate brownie with walnuts',
      descriptionAr: 'براوني الشوكولاتة الغني مع الجوز',
      price: 12.0,
      image: '/images/products/brownie.jpg',
      category: 'desserts',
      categoryAr: 'حلويات',
      rating: 4.7,
      prepTime: '2-3 min',
      prepTimeAr: '2-3 دقائق',
      featured: false,
      available: true,
    },
    {
      id: 'croissant-butter',
      name: 'Butter Croissant',
      nameAr: 'كرواسان بالزبدة',
      description: 'Flaky, buttery croissant baked fresh daily',
      descriptionAr: 'كرواسان مقرمش بالزبدة مخبوز طازج يومياً',
      price: 6.0,
      image: '/images/products/croissant.jpg',
      category: 'pastries',
      categoryAr: 'معجنات',
      rating: 4.6,
      prepTime: '1-2 min',
      prepTimeAr: '1-2 دقيقة',
      featured: false,
      available: true,
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      (language === 'ar' ? product.nameAr : product.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language === 'ar' ? product.descriptionAr : product.description).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <Coffee className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">
              {language === 'ar' ? 'منتجاتنا' : 'Our Products'}
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed">
              {language === 'ar' 
                ? 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
                : 'Discover our premium collection of carefully crafted coffee and desserts'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="py-8 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-amber-600" />
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ar' ? 'جرب تغيير فلاتر البحث' : 'Try changing your search filters'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-amber-200 to-orange-300 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Coffee className="w-20 h-20 text-amber-800" />
                      </div>
                      {product.featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {language === 'ar' ? 'مميز' : 'Featured'}
                        </div>
                      )}
                      {!product.available && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                            {language === 'ar' ? 'غير متوفر' : 'Unavailable'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
                          {language === 'ar' ? product.nameAr : product.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{product.rating}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {language === 'ar' ? product.descriptionAr : product.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{language === 'ar' ? product.prepTimeAr : product.prepTime}</span>
                        </div>
                        <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          {language === 'ar' ? product.categoryAr : product.category.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-amber-700">
                          {product.price} {language === 'ar' ? 'ريال عماني' : 'OMR'}
                        </div>
                        <button 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!product.available}
                          aria-label={language === 'ar' ? 'أضف إلى السلة' : 'Add to cart'}
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'فئات مميزة' : 'Featured Categories'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'قهوة مختصة' : 'Specialty Coffee'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'مجموعة متنوعة من القهوة المحضرة بعناية من أجود الحبوب'
                  : 'Variety of carefully prepared coffee from the finest beans'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'حلويات طازجة' : 'Fresh Desserts'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'حلويات محضرة يومياً بأجود المكونات'
                  : 'Daily prepared desserts with the finest ingredients'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'معجنات مخبوزة' : 'Baked Pastries'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'معجنات طازجة مخبوزة يومياً في مخبزنا'
                  : 'Fresh pastries baked daily in our bakery'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};