import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import type { ChatProduct } from '../../services/geminiChatService';

interface ProductCardProps {
  product: ChatProduct;
  regionPrefix: string;
  language: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, regionPrefix, language }) => {
  const [imgError, setImgError] = useState(false);
  const isAr = language === 'ar';
  const displayName = isAr && product.nameAr ? product.nameAr : product.name;
  const productUrl = `${regionPrefix}/shop/product/${product.slug || product.id}`;

  const formatPrice = (price: number) => {
    if (price <= 0) return null;
    return isAr ? `${price.toFixed(3)} ر.ع` : `${price.toFixed(3)} OMR`;
  };

  return (
    <Link
      to={productUrl}
      className="group flex gap-3 rounded-xl border border-amber-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-amber-300 hover:shadow-md"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-amber-50">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">☕</div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-2 text-sm font-semibold text-gray-800 leading-tight">
            {displayName}
          </p>
          {product.category && (
            <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              {product.category}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex items-center gap-1">
            {product.discountPrice && product.discountPrice < product.price ? (
              <>
                <span className="text-sm font-bold text-amber-700">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-amber-700">
                {formatPrice(product.price) ?? (isAr ? 'السعر عند الطلب' : 'Price on request')}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-600">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow icon */}
      <div className="flex flex-shrink-0 items-center text-amber-400 transition-transform duration-200 group-hover:translate-x-1">
        <ExternalLink className="h-4 w-4" />
      </div>
    </Link>
  );
};
