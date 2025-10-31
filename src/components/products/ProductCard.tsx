import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Product } from '../../contexts/AppContextDefinition';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 hover:border-amber-300">
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback image if the provided image fails to load
            e.currentTarget.src = '/images/slides/slide1.webp';
          }}
        />
        
        {/* Featured Badge */}
        {product.featured && (
          <Badge className="absolute top-2 left-2 bg-amber-600 hover:bg-amber-700 text-white">
            {t('sections.featuredProducts')}
          </Badge>
        )}
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-gray-900"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-700 transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{product.category}</span>
            <span className="text-xl font-bold text-amber-600">
              ${product.price}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Product Actions */}
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full space-x-2">
          <Button
            variant="outline"
            className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            {t('products.viewDetails')}
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('products.addToCart')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};