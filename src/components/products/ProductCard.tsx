import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import type { Product } from '../../contexts/AppContextDefinition';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md py-0">
      {/* Product Image - Square aspect ratio */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = '/images/slides/slide1.webp';
          }}
        />
        
        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Product Content - Compact */}
      <CardContent className="p-3">
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-amber-600 mb-2 line-clamp-1">
          {product.tastingNotes || '---'}
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

      {/* Add to Cart Button - Compact */}
      <CardFooter className="p-3 pt-0">
        <Button
          size="sm"
          className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-semibold">{isArabic ? 'إضافة للسلة' : 'Add to Cart'}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};