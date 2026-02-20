import { useMemo, useState } from 'react';
import { useShopPage } from '../../hooks/useShop';
import { CategorySection } from '../../components/shop/CategorySection';
import { CategoryNav, type CategoryFilter } from '../../components/shop/CategoryNav';
import { useApp } from '../../hooks/useApp';
import { Seo } from '../../components/seo/Seo';
import { siteMetadata } from '../../config/siteMetadata';
import { PageHeader } from '../../components/layout/PageHeader';
import { AnnouncementBar } from '../../components/layout/AnnouncementBar';
import type { ShopCategory } from '../../types/shop';

export const ShopPage = () => {
  const { shopData, loading, error } = useShopPage();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  const filteredCategories = useMemo(() => {
    if (!shopData) {
      return [] as ShopCategory[];
    }

    const toSearchText = (category: ShopCategory) =>
      `${category.slug} ${category.name} ${category.nameAr ?? ''}`.toLowerCase();

    const matchesBundles = (category: ShopCategory) => {
      const text = toSearchText(category);
      return text.includes('bundle') || text.includes('bundles') || text.includes('باقة') || text.includes('حزمة');
    };

    const matchesGiftCards = (category: ShopCategory) => {
      const text = toSearchText(category);
      return (
        text.includes('gift card') ||
        text.includes('gift-card') ||
        text.includes('giftcard') ||
        text.includes('بطاقة') ||
        text.includes('بطاقات')
      );
    };

    if (activeFilter === 'bundles') {
      return shopData.categories.filter(matchesBundles);
    }

    if (activeFilter === 'gift-cards') {
      return shopData.categories.filter(matchesGiftCards);
    }

    if (activeFilter === 'under-15') {
      return shopData.categories
        .map((category) => {
          const products = category.products.filter((product) => {
            const price = product.minPrice ?? product.maxPrice ?? Number.POSITIVE_INFINITY;
            return price <= 15;
          });

          if (products.length === 0) {
            return null;
          }

          return {
            ...category,
            products,
            productCount: products.length,
          };
        })
        .filter((category): category is ShopCategory => Boolean(category));
    }

    return shopData.categories;
  }, [shopData, activeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Page Header Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-20 md:py-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center">
            <div className="h-9 w-48 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-80 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
          {/* Category Nav Skeleton — filter chips + category buttons */}
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex gap-4 overflow-hidden">
              {["w-16", "w-28", "w-24", "w-28"].map((w, i) => (
                <div key={i} className={`h-9 ${w} shrink-0 animate-pulse rounded-full bg-stone-100`} />
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              {["w-36", "w-32", "w-40", "w-28", "w-36"].map((w, i) => (
                <div key={i} className={`h-10 ${w} shrink-0 animate-pulse rounded-full bg-stone-50`} />
              ))}
            </div>
          </div>

          {/* Category Sections Skeleton */}
          <div className="space-y-12">
            {[0, 1].map((section) => (
              <div key={section} className="space-y-6">
                {/* Category Header */}
                <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-stone-100" />
                    <div className="space-y-2">
                      <div className="h-6 w-40 animate-pulse rounded-lg bg-stone-100" />
                      <div className="h-3 w-56 animate-pulse rounded bg-stone-50" />
                      <div className="h-3 w-20 animate-pulse rounded bg-stone-50" />
                    </div>
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded-full bg-stone-100" />
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((card) => (
                    <div key={card} className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                      <div className="aspect-square w-full animate-pulse bg-stone-100" />
                      <div className="space-y-2.5 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-stone-50" />
                        <div className="h-5 w-24 animate-pulse rounded-lg bg-stone-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">
            {isArabic ? 'تعذر تحميل صفحة المتجر' : 'Unable to load shop page'}
          </h2>
          <p className="mt-3 text-sm text-stone-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!shopData) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-stone-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      <AnnouncementBar />
      <Seo
        title={isArabic ? 'المتجر | SpiritHub' : 'Shop | SpiritHub'}
        description={
          isArabic
            ? 'تسوق منتجات المحمصة حسب الفئات مع أفضل اختياراتنا.'
            : 'Browse roastery products by category with our best selections.'
        }
        canonical={`${siteMetadata.baseUrl}/shop`}
        type="website"
      />

      <PageHeader
        title="Shop"
        titleAr="المتجر"
        subtitle="Discover curated roastery collections and seasonal highlights."
        subtitleAr="اكتشف مجموعات المحمصة المختارة وأفضل الإصدارات الموسمية."
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">

        {filteredCategories.length > 0 ? (
          <>
            <CategoryNav
              categories={filteredCategories}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <div className="space-y-12">
              {filteredCategories.map((category) => (
                <CategorySection key={category.id} category={category} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">
              {isArabic ? 'لا توجد فئات متاحة حالياً' : 'No categories available yet'}
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              {isArabic
                ? 'سيتم تحديث المتجر قريباً بمنتجات جديدة.'
                : 'We’re preparing fresh collections. Please check back soon.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
