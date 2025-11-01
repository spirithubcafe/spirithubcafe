import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { useCart } from '../../hooks/useCart';
import type { Product } from '../../contexts/AppContextDefinition';
import { handleImageError } from '../../lib/imageUtils';
import { ProductQuickView } from './ProductQuickView';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { addToCart, openCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClosingQuickView, setIsClosingQuickView] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load wishlist status from localStorage on mount
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.includes(String(product.id)));
  }, [product.id]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking wishlist
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    let updatedWishlist: string[];
    
    if (wishlist.includes(String(product.id))) {
      // Remove from wishlist
      updatedWishlist = wishlist.filter((id: string) => id !== String(product.id));
      setIsWishlisted(false);
    } else {
      // Add to wishlist
      updatedWishlist = [...wishlist, String(product.id)];
      setIsWishlisted(true);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Add to cart
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      tastingNotes: product.tastingNotes,
    });

    // Wait for animation
    setTimeout(() => {
      setIsAnimating(false);
      openCart();
    }, 800);
  };

  const handleCardClick = () => {
    // Don't navigate if we're in the process of closing the quick view
    if (isClosingQuickView) {
      return;
    }
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/products/${product.id}`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking quick view
    setShowQuickView(true);
  };

  const handleQuickViewClose = (open: boolean) => {
    if (!open) {
      // Set flag to prevent navigation
      setIsClosingQuickView(true);
      setShowQuickView(false);
      // Clear the flag after a short delay
      setTimeout(() => {
        setIsClosingQuickView(false);
      }, 300);
    } else {
      setShowQuickView(open);
    }
  };

  return (
    <Card 
      ref={cardRef} 
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md py-0 relative cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Wishlist Button - Positioned absolutely in top-right corner */}
      <Button
        size="sm"
        variant="ghost"
        className={`absolute top-2 ${isArabic ? 'left-2' : 'right-2'} z-10 w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md transition-all ${
          isWishlisted 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
        }`}
        onClick={handleToggleWishlist}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image - Square aspect ratio */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(event) => handleImageError(event, '/images/products/default-product.webp')}
        />
        
        {/* Animated clone for cart animation */}
        {isAnimating && (
          <motion.img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            initial={{ scale: 1, opacity: 1, y: 0, x: 0 }}
            animate={{
              scale: [1, 0.8, 0],
              opacity: [1, 1, 0],
              y: [0, -20, -100],
              x: isArabic ? [0, -100, -300] : [0, 100, 300],
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}
        
        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Product Content - Compact */}
      <CardContent className="p-3">
        {/* Category Badge */}
        {product.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200">
              {product.category}
            </span>
          </div>
        )}
        
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-amber-600 mb-2 line-clamp-1">
          {(isArabic ? product.tastingNotesAr : product.tastingNotes) || '---'}
        </p>
        {/* Price at bottom */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">{isArabic ? 'السعر' : 'Price'}</span>
          <span className="text-lg font-bold text-amber-600">
            {product.price > 0 
              ? `${product.price.toFixed(3)} ${isArabic ? 'ر.ع' : 'OMR'}` 
              : (isArabic ? 'قريباً' : 'Soon')}
          </span>
        </div>
      </CardContent>

      {/* Action Buttons - Compact */}
      <CardFooter className="p-3 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-50 hover:border-amber-700 hover:text-amber-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            onClick={handleQuickView}
            disabled={isAnimating || product.price <= 0}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            onClick={handleAddToCart}
            disabled={isAnimating || product.price <= 0}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs font-semibold">
              {isAnimating 
                ? (isArabic ? 'جاري الإضافة...' : 'Adding...') 
                : (isArabic ? 'إضافة للسلة' : 'Add to Cart')}
            </span>
          </Button>
        </div>
      </CardFooter>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        open={showQuickView}
        onOpenChange={handleQuickViewClose}
      />
    </Card>
  );
};
