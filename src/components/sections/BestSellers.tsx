import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../products/ProductCard';
import { useApp } from '../../hooks/useApp';
import { productService } from '../../services/productService';
import { getProductImageUrl } from '../../lib/imageUtils';
import type { Product } from '../../contexts/AppContextDefinition';

export const BestSellers: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useApp();
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getBestSellers(6);
      const mapped: Product[] = (Array.isArray(data) ? data : []).map((p) => {
        const record = p as unknown as Record<string, unknown>;
        const minPrice = typeof record.minPrice === 'number' ? record.minPrice : 0;
        const price = typeof record.price === 'number' ? record.price : minPrice;
        const imagePath = (record.mainImagePath as string) || (record.imagePath as string) || '';
        const lang = language;
        return {
          id: String(record.id),
          slug: (record.slug as string) || undefined,
          isActive: true,
          isOrderable: price > 0,
          isLimited: (record.isLimited as boolean) || undefined,
          isPremium: (record.isPremium as boolean) || undefined,
          name: lang === 'ar' && record.nameAr ? String(record.nameAr) : String(record.name || ''),
          nameAr: record.nameAr ? String(record.nameAr) : undefined,
          description: lang === 'ar' && record.descriptionAr ? String(record.descriptionAr) : String(record.description || ''),
          descriptionAr: record.descriptionAr ? String(record.descriptionAr) : undefined,
          price,
          image: imagePath ? getProductImageUrl(imagePath) : '',
          categoryId: record.categoryId != null ? String(record.categoryId) : undefined,
          categorySlug: (record.categorySlug as string) || undefined,
          category: lang === 'ar'
            ? String(record.categoryNameAr || record.categoryName || '')
            : String(record.categoryName || record.categoryNameAr || ''),
          tastingNotes: lang === 'ar' && record.tastingNotesAr ? String(record.tastingNotesAr) : (record.tastingNotes as string) || undefined,
          tastingNotesAr: record.tastingNotesAr ? String(record.tastingNotesAr) : undefined,
          featured: (record.isFeatured as boolean) || undefined,
          topTags: (() => {
            const raw = record.topTags;
            if (Array.isArray(raw)) return raw;
            if (raw && typeof raw === 'object' && '$values' in (raw as Record<string, unknown>)) {
              const vals = (raw as Record<string, unknown>).$values;
              return Array.isArray(vals) ? vals : undefined;
            }
            return undefined;
          })(),
          bottomTags: (() => {
            const raw = record.bottomTags;
            if (Array.isArray(raw)) return raw;
            if (raw && typeof raw === 'object' && '$values' in (raw as Record<string, unknown>)) {
              const vals = (raw as Record<string, unknown>).$values;
              return Array.isArray(vals) ? vals : undefined;
            }
            return undefined;
          })(),
        } as Product;
      });
      setBestSellerProducts(mapped);
    } catch (err) {
      console.error('[BestSellers] fetch error:', err);
      setBestSellerProducts([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header Skeleton */}
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="h-8 w-52 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>
          {/* Product Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="aspect-square w-full animate-pulse bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                  <div className="h-4 w-20 animate-pulse rounded-md bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (bestSellerProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
            {t('sections.bestSellers')}
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('sections.bestSellersDescription')}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {bestSellerProducts.map((product, index) => (
            <div
              key={product.id}
              className="transform transition-all duration-300 hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                {/* Badges are now handled by ProductCard component */}
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <a
            href="/products"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide"
          >
            {t('sections.viewAllProducts')}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};
