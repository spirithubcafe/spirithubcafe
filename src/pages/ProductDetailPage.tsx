import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { Coffee, Star, Clock, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight, Heart, Share2 } from 'lucide-react';

interface ProductDetails {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  longDescription: string;
  longDescriptionAr: string;
  price: number;
  images: string[];
  category: string;
  categoryAr: string;
  rating: number;
  reviewCount: number;
  prepTime: string;
  prepTimeAr: string;
  featured: boolean;
  available: boolean;
  ingredients: string[];
  ingredientsAr: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    caffeine?: number;
  };
  allergens: string[];
  allergensAr: string[];
  sizes: Array<{
    name: string;
    nameAr: string;
    price: number;
    ml?: number;
  }>;
}

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { language } = useApp();
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock product data - في التطبيق الحقيقي، سيتم جلب هذه البيانات من API
  const products: Record<string, ProductDetails> = {
    'espresso-premium': {
      id: 'espresso-premium',
      name: 'Premium Espresso',
      nameAr: 'إسبريسو مميز',
      description: 'Rich and concentrated espresso made from premium Arabic beans',
      descriptionAr: 'إسبريسو غني ومركز من حبوب القهوة العربية المميزة',
      longDescription: 'Our Premium Espresso is crafted from the finest Arabic beans, sourced directly from the mountains of Yemen and Ethiopia. Each shot is pulled to perfection, creating a rich, full-bodied flavor with notes of chocolate and caramel. The crema on top is thick and golden, indicating the quality of our extraction process.',
      longDescriptionAr: 'إسبريسو المميز مصنوع من أجود حبوب القهوة العربية، مصدرها مباشرة من جبال اليمن وإثيوبيا. كل جرعة محضرة بإتقان، تخلق نكهة غنية وقوية مع نفحات الشوكولاتة والكراميل. الكريمة في الأعلى سميكة وذهبية، مما يدل على جودة عملية الاستخراج.',
      price: 7.2,
      images: ['/images/products/espresso-1.jpg', '/images/products/espresso-2.jpg', '/images/products/espresso-3.jpg'],
      category: 'hot-coffee',
      categoryAr: 'قهوة ساخنة',
      rating: 4.8,
      reviewCount: 127,
      prepTime: '3-5 min',
      prepTimeAr: '3-5 دقائق',
      featured: true,
      available: true,
      ingredients: ['Arabic Coffee Beans', 'Filtered Water'],
      ingredientsAr: ['حبوب القهوة العربية', 'ماء مفلتر'],
      nutritionalInfo: {
        calories: 5,
        protein: 0.3,
        fat: 0.1,
        carbs: 0.8,
        caffeine: 120,
      },
      allergens: ['None'],
      allergensAr: ['لا يوجد'],
      sizes: [
        { name: 'Single Shot', nameAr: 'جرعة واحدة', price: 7.2, ml: 30 },
        { name: 'Double Shot', nameAr: 'جرعة مزدوجة', price: 10.0, ml: 60 },
      ],
    },
    'cappuccino-classic': {
      id: 'cappuccino-classic',
      name: 'Classic Cappuccino',
      nameAr: 'كابتشينو كلاسيكي',
      description: 'Perfect balance of espresso, steamed milk, and foam',
      descriptionAr: 'توازن مثالي بين الإسبريسو والحليب المبخر والرغوة',
      longDescription: 'Our Classic Cappuccino is the perfect harmony of rich espresso, velvety steamed milk, and light, airy foam. Made with our signature espresso blend and fresh whole milk, this traditional Italian favorite delivers a smooth, creamy texture with a bold coffee flavor that will warm your soul.',
      longDescriptionAr: 'الكابتشينو الكلاسيكي هو الانسجام المثالي بين الإسبريسو الغني والحليب المبخر الناعم والرغوة الخفيفة الهوائية. مصنوع من خلطة الإسبريسو المميزة والحليب الطازج الكامل الدسم، هذا المفضل الإيطالي التقليدي يقدم ملمساً ناعماً وكريمياً مع نكهة قهوة جريئة تدفئ الروح.',
      price: 8.8,
      images: ['/images/products/cappuccino-1.jpg', '/images/products/cappuccino-2.jpg'],
      category: 'hot-coffee',
      categoryAr: 'قهوة ساخنة',
      rating: 4.7,
      reviewCount: 203,
      prepTime: '4-6 min',
      prepTimeAr: '4-6 دقائق',
      featured: true,
      available: true,
      ingredients: ['Arabic Coffee Beans', 'Fresh Whole Milk', 'Filtered Water'],
      ingredientsAr: ['حبوب القهوة العربية', 'حليب طازج كامل الدسم', 'ماء مفلتر'],
      nutritionalInfo: {
        calories: 150,
        protein: 8,
        fat: 8,
        carbs: 12,
        caffeine: 80,
      },
      allergens: ['Dairy'],
      allergensAr: ['منتجات الألبان'],
      sizes: [
        { name: 'Small', nameAr: 'صغير', price: 8.8, ml: 180 },
        { name: 'Medium', nameAr: 'متوسط', price: 10.8, ml: 240 },
        { name: 'Large', nameAr: 'كبير', price: 12.8, ml: 350 },
      ],
    },
    // يمكن إضافة باقي المنتجات هنا...
  };

  const product = productId ? products[productId] : null;

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const currentPrice = product.sizes[selectedSize].price;
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    // هنا يمكن إضافة المنتج إلى السلة
    alert(language === 'ar' 
      ? `تمت إضافة ${quantity} من ${product.nameAr} إلى السلة` 
      : `Added ${quantity} ${product.name} to cart`
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'ar' ? product.nameAr : product.name,
          text: language === 'ar' ? product.descriptionAr : product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
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
            <span>/</span>
            <span className="text-amber-700 font-semibold">
              {language === 'ar' ? product.nameAr : product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="relative bg-gradient-to-br from-amber-200 to-orange-300 rounded-2xl overflow-hidden aspect-square">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Coffee className="w-32 h-32 text-amber-800" />
                  </div>
                  {product.featured && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold">
                      {language === 'ar' ? 'مميز' : 'Featured'}
                    </div>
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`${language === 'ar' ? 'عرض الصورة' : 'View image'} ${index + 1}`}
                        className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-300 rounded-lg overflow-hidden ${
                          currentImageIndex === index ? 'ring-2 ring-amber-500' : ''
                        }`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Coffee className="w-8 h-8 text-amber-800" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">
                      {language === 'ar' ? product.nameAr : product.name}
                    </h1>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        aria-label={language === 'ar' ? (isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة') : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
                        className={`p-2 rounded-full transition-colors ${
                          isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={handleShare}
                        aria-label={language === 'ar' ? 'مشاركة المنتج' : 'Share product'}
                        className="p-2 rounded-full text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{product.rating}</span>
                      <span className="text-gray-500 text-sm">({product.reviewCount} {language === 'ar' ? 'تقييم' : 'reviews'})</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{language === 'ar' ? product.prepTimeAr : product.prepTime}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {language === 'ar' ? product.longDescriptionAr : product.longDescription}
                  </p>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
                  <div className="text-3xl font-bold text-amber-700 mb-2">
                    {totalPrice} {language === 'ar' ? 'ريال عماني' : 'OMR'}
                  </div>
                  {quantity > 1 && (
                    <div className="text-gray-600">
                      {currentPrice} {language === 'ar' ? 'ريال عماني × ' : 'OMR × '}{quantity}
                    </div>
                  )}
                </div>

                {/* Size Selection */}
                {product.sizes.length > 1 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      {language === 'ar' ? 'الحجم' : 'Size'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {product.sizes.map((size, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(index)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedSize === index
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-gray-300 hover:border-amber-300'
                          }`}
                        >
                          <div className="font-semibold">
                            {language === 'ar' ? size.nameAr : size.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {size.price} {language === 'ar' ? 'ريال عماني' : 'OMR'}
                            {size.ml && ` • ${size.ml}ml`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {language === 'ar' ? 'الكمية' : 'Quantity'}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity <= 1}
                        aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to Cart */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.available}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {product.available 
                      ? (language === 'ar' ? 'إضافة للسلة' : 'Add to Cart')
                      : (language === 'ar' ? 'غير متوفر' : 'Unavailable')
                    }
                  </button>
                  <Link
                    to="/products"
                    className="px-6 py-4 border border-amber-500 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-2"
                  >
                    {language === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                    {language === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {/* Ingredients */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'ar' ? 'المكونات' : 'Ingredients'}
                </h3>
                <ul className="space-y-2">
                  {(language === 'ar' ? product.ingredientsAr : product.ingredients).map((ingredient, index) => (
                    <li key={index} className="text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nutritional Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'ar' ? 'القيم الغذائية' : 'Nutritional Info'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'السعرات' : 'Calories'}</span>
                    <span className="font-semibold">{product.nutritionalInfo.calories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'البروتين' : 'Protein'}</span>
                    <span className="font-semibold">{product.nutritionalInfo.protein}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'الدهون' : 'Fat'}</span>
                    <span className="font-semibold">{product.nutritionalInfo.fat}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'الكربوهيدرات' : 'Carbs'}</span>
                    <span className="font-semibold">{product.nutritionalInfo.carbs}g</span>
                  </div>
                  {product.nutritionalInfo.caffeine && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'ar' ? 'الكافيين' : 'Caffeine'}</span>
                      <span className="font-semibold">{product.nutritionalInfo.caffeine}mg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Allergens */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'ar' ? 'مسببات الحساسية' : 'Allergens'}
                </h3>
                <div className="space-y-2">
                  {(language === 'ar' ? product.allergensAr : product.allergens).map((allergen, index) => (
                    <span
                      key={index}
                      className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};