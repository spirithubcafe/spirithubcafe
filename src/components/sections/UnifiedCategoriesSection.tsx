import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useShopPage } from '../../hooks/useShop';
import { useRegion } from '../../hooks/useRegion';
import { buildResponsiveSrcSet, getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';

type UnifiedCategoryItem = {
  id: string;
  name: string;
  image: string;
  href: string;
  group: 'coffee' | 'shop';
};

const CARD_WIDTH = 212;
const SCROLL_STEP = 300;

const GIFT_HINT_EN = '❤️ Gift Someone Special';
const GIFT_HINT_AR = '❤️ أهدي شخص مميز';
const LIMITED_HINT_EN = '✨ Limited Release';
const LIMITED_HINT_AR = '✨ إصدار محدود';

const isGiftOrBundleCategory = (item: UnifiedCategoryItem): boolean => {
  const haystack = `${item.name} ${item.href}`.toLowerCase();
  return (
    haystack.includes('bundle') ||
    haystack.includes('gift') ||
    haystack.includes('هدية') ||
    haystack.includes('هدايا') ||
    haystack.includes('أهدي')
  );
};

const isCompetitionPremiumCategory = (item: UnifiedCategoryItem): boolean => {
  const haystack = `${item.name} ${item.href}`.toLowerCase();
  return (
    haystack.includes('competition premium') ||
    haystack.includes('premium series') ||
    haystack.includes('series') ||
    haystack.includes('منافسة') ||
    haystack.includes('محدود')
  );
};

export const UnifiedCategoriesSection: React.FC = () => {
  const { categories, loading: appLoading, language, t } = useApp();
  const { shopData, loading: shopLoading } = useShopPage();
  const { currentRegion } = useRegion();

  const isArabic = language === 'ar';
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const allItems = useMemo<UnifiedCategoryItem[]>(() => {
    const coffeeItems = categories.map((category) => ({
      id: `coffee-${category.id}`,
      name: category.name,
      image: category.image || '/images/slides/slide1.webp',
      href: `/products?category=${category.id}`,
      group: 'coffee' as const,
    }));

    const shopItems = (shopData?.categories ?? []).map((category) => ({
      id: `shop-${category.id}`,
      name: isArabic ? category.nameAr || category.name : category.name,
      image: getCategoryImageUrl(category.imagePath),
      href: `/${currentRegion.code}/shop/${category.slug}`,
      group: 'shop' as const,
    }));

    return [...coffeeItems, ...shopItems];
  }, [categories, currentRegion.code, isArabic, shopData?.categories]);

  const renderItems = useMemo(
    () => (isArabic ? [...allItems].reverse() : allItems),
    [allItems, isArabic],
  );

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const threshold = 2;
    setCanScrollLeft(el.scrollLeft > threshold);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - threshold);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [renderItems.length, updateArrows]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => updateArrows();
    const onResize = () => updateArrows();

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateArrows]);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === 'left' ? -SCROLL_STEP : SCROLL_STEP,
      behavior: 'smooth',
    });
  }, []);

  if (appLoading && shopLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <div className="h-8 w-56 mx-auto animate-pulse rounded-lg bg-gray-200" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl border border-gray-100 bg-white shadow-sm"
                style={{ width: `${CARD_WIDTH}px` }}
              >
                <div className="aspect-square w-full animate-pulse bg-gray-100" />
                <div className="p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (allItems.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {(t('sections.categories') || 'Categories').toUpperCase()}
          </h2>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-10 bg-gradient-to-r from-white via-white/75 to-transparent md:block" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-10 bg-gradient-to-l from-white via-white/75 to-transparent md:block" />

          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
            onClick={() => scrollByAmount('left')}
            disabled={!canScrollLeft}
            className="hidden md:flex absolute left-2 top-1/2 z-20 -translate-y-1/2 border border-gray-200/70 bg-white/90 backdrop-blur-md shadow-md rounded-full w-10 h-10 items-center justify-center text-gray-700 transition hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
            onClick={() => scrollByAmount('right')}
            disabled={!canScrollRight}
            className="hidden md:flex absolute right-2 top-1/2 z-20 -translate-y-1/2 border border-gray-200/70 bg-white/90 backdrop-blur-md shadow-md rounded-full w-10 h-10 items-center justify-center text-gray-700 transition hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            dir="ltr"
            className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [touch-action:pan-x_pan-y]"
          >
            {renderItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="group block shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                style={{ width: `${CARD_WIDTH}px` }}
              >
                <div className="h-full overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:border-gray-300/80 flex flex-col">
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <img
                      src={item.image}
                      srcSet={buildResponsiveSrcSet(item.image, [160, 240, 320, 480])}
                      sizes="(max-width: 768px) 58vw, 212px"
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, '/images/slides/slide1.webp')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center p-3.5">
                    <h3 className="line-clamp-2 min-h-[2.6rem] text-center text-[0.92rem] font-semibold leading-5 text-gray-900 transition-colors duration-200 group-hover:text-amber-700">
                      {item.name}
                    </h3>
                    {isCompetitionPremiumCategory(item) ? (
                      <p className="mt-1 text-center text-[0.72rem] font-semibold leading-4 text-rose-600">
                        {isArabic ? LIMITED_HINT_AR : LIMITED_HINT_EN}
                      </p>
                    ) : null}
                    {!isCompetitionPremiumCategory(item) && isGiftOrBundleCategory(item) ? (
                      <p className="mt-1 text-center text-[0.72rem] font-semibold leading-4 text-rose-600">
                        {isArabic ? GIFT_HINT_AR : GIFT_HINT_EN}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
