import { useShopPage } from '../../hooks/useShop';
import { CategorySection } from '../../components/shop/CategorySection';
import { CategoryNav } from '../../components/shop/CategoryNav';
import { useApp } from '../../hooks/useApp';
import { Seo } from '../../components/seo/Seo';
import { siteMetadata } from '../../config/siteMetadata';
import { PageHeader } from '../../components/layout/PageHeader';

export const ShopPage = () => {
  const { shopData, loading, error } = useShopPage();
  const { language } = useApp();
  const isArabic = language === 'ar';

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
          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-stone-100" />
              </div>
            ))}
          </div>

          {/* Category Nav Skeleton */}
          <div className="flex gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-stone-100" />
            ))}
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
                      <div className="h-48 w-full animate-pulse bg-stone-100" />
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
        <div className="grid gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-amber-700">
              {isArabic ? 'مختارات اليوم' : 'Today’s highlights'}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              {isArabic
                ? 'منتجات منتقاة بعناية لعشاق القهوة المختصة.'
                : 'Handpicked selections for specialty coffee lovers.'}
            </p>
          </div>
        </div>

        {shopData.categories.length > 0 ? (
          <>
            <CategoryNav categories={shopData.categories} />

            <div className="space-y-12">
              {shopData.categories.map((category) => (
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
