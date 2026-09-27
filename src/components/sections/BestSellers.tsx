import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ProductCard } from '../products/ProductCard';
import { productService } from '../../services/productService';
import { getProductImageUrl } from '../../lib/imageUtils';
import { normalizeProductTags } from '../../lib/productTagUtils';
import type { Product } from '../../contexts/AppContextDefinition';

export const BestSellers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      let data: unknown[] = [];
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await productService.getBestSellers(6);
          data = Array.isArray(response) ? response : [];
          // Retry once more if we got a suspicious empty payload.
          if (data.length === 0 && attempt < 3) {
            await wait(250 * attempt);
            continue;
          }
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (attempt < 3) {
            await wait(300 * attempt);
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      const mapped: Product[] = (Array.isArray(data) ? data : []).map((p) => {
        const record = p as unknown as Record<string, unknown>;
        const minPrice = typeof record.minPrice === 'number' ? record.minPrice : 0;
        const price = typeof record.price === 'number' ? record.price : minPrice;
        const imagePath = (record.mainImagePath as string) || (record.imagePath as string) || '';
        return {
          id: String(record.id),
          slug: (record.slug as string) || undefined,
          isActive: true,
          isOrderable: price > 0,
          isLimited: (record.isLimited as boolean) || undefined,
          isPremium: (record.isPremium as boolean) || undefined,
          name: String(record.name || record.nameAr || ''),
          nameAr: record.nameAr ? String(record.nameAr) : undefined,
          description: String(record.description || record.descriptionAr || ''),
          descriptionAr: record.descriptionAr ? String(record.descriptionAr) : undefined,
          price,
          image: imagePath ? getProductImageUrl(imagePath) : '',
          categoryId: record.categoryId != null ? String(record.categoryId) : undefined,
          categorySlug: (record.categorySlug as string) || undefined,
          category: String(record.categoryName || record.categoryNameAr || ''),
          categoryAr: record.categoryNameAr ? String(record.categoryNameAr) : undefined,
          tastingNotes: (record.tastingNotes as string) || (record.tastingNotesAr as string) || undefined,
          tastingNotesAr: record.tastingNotesAr ? String(record.tastingNotesAr) : undefined,
          featured: (record.isFeatured as boolean) || undefined,
          topTags: normalizeProductTags(record.topTags, 'Top'),
          bottomTags: normalizeProductTags(record.bottomTags, 'Bottom'),
        } as Product;
      });
      setBestSellerProducts(mapped);
    } catch (err) {
      console.error('[BestSellers] fetch error:', err);
      setBestSellerProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  if (loading) {
    return (
      <section className="pt-6 pb-5 bg-white sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header Skeleton */}
          <div className="flex flex-col gap-3 mb-8 sm:mb-10">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-52 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>
          {/* Product Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
    <section className="pt-6 pb-5 bg-white sm:pt-8 sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
            {t('sections.bestSellersEyebrow')}
          </p>
          <h2 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
            {t('sections.bestSellers')}
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:max-w-xl sm:text-base">
            {t('sections.bestSellersDescription')}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
          {bestSellerProducts.map((product, index) => (
            <div
              key={product.id}
              className="h-full transform transition-all duration-300 hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-full">
                {/* Badges are now handled by ProductCard component */}
                <ProductCard product={product} variant="homepage" />
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <a
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            {t('sections.viewAllProducts')}
            <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
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
