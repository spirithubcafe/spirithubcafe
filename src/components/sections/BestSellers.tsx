import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ProductCard } from '../products/ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { productService } from '../../services/productService';
import { getProductImageUrl } from '../../lib/imageUtils';
import { normalizeProductTags } from '../../lib/productTagUtils';
import type { Product } from '../../contexts/AppContextDefinition';
import { HOMEPAGE_CONTAINER, homepageSectionClassName } from './homepageSectionSpacing';
import { HomeSectionHeader } from './HomeSectionHeader';

export const BestSellers: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const regionPrefix = location.pathname.startsWith('/sa') ? '/sa' : '/om';
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
    return <ProductGridSkeleton count={6} />;
  }

  if (bestSellerProducts.length === 0) {
    return null;
  }

  return (
    <section className={homepageSectionClassName('bg-white')}>
      <div className={HOMEPAGE_CONTAINER}>
        <HomeSectionHeader
          eyebrow={t('sections.bestSellersEyebrow')}
          title={t('sections.bestSellers')}
          action={{ label: t('sections.viewAllProducts'), to: `${regionPrefix}/products` }}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
          {bestSellerProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="homepage" />
          ))}
        </div>
      </div>
    </section>
  );
};
