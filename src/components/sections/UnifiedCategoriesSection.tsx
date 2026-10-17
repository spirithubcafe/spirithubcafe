import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useApp } from '../../hooks/useApp';
import { useShopPage } from '../../hooks/useShop';
import { useRegion } from '../../hooks/useRegion';
import { buildResponsiveSrcSet, getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { homepageSectionClassName } from './homepageSectionSpacing';

type UnifiedCategoryItem = {
  id: string;
  name: string;
  nameAr?: string;
  image: string;
  href: string;
  group: 'coffee' | 'shop';
};

const CARD_WIDTH = 220;

export const UnifiedCategoriesSection: React.FC = () => {
  const { categories, loading: appLoading, language, t } = useApp();
  const { shopData, loading: shopLoading } = useShopPage();
  const { currentRegion } = useRegion();

  const isArabic = language === 'ar';
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
  });

  const allItems = useMemo<UnifiedCategoryItem[]>(() => {
    const coffeeItems = categories.map((category) => ({
      id: `coffee-${category.id}`,
      name: isArabic ? category.nameAr || category.name : category.name,
      nameAr: category.nameAr,
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
    if (!emblaApi) return;
    setCanScrollLeft(emblaApi.canScrollPrev());
    setCanScrollRight(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    emblaApi?.reInit();
    updateArrows();
  }, [renderItems.length, emblaApi, updateArrows]);

  useEffect(() => {
    if (!emblaApi) return;
    updateArrows();
    emblaApi.on('select', updateArrows);
    emblaApi.on('reInit', updateArrows);

    return () => {
      emblaApi.off('select', updateArrows);
      emblaApi.off('reInit', updateArrows);
    };
  }, [emblaApi, updateArrows]);

  useEffect(() => {
    if (!emblaApi || !isArabic || renderItems.length === 0) return;
    emblaApi.scrollTo(emblaApi.scrollSnapList().length - 1, true);
    updateArrows();
  }, [emblaApi, isArabic, renderItems.length, updateArrows]);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    if (!emblaApi) return;
    if (direction === 'left') {
      emblaApi.scrollPrev();
      return;
    }
    emblaApi.scrollNext();
  }, [emblaApi]);

  if (appLoading && shopLoading) {
    return (
      <section className={homepageSectionClassName('bg-white')}>
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
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
    <section className={homepageSectionClassName('bg-white')}>
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 sm:mb-8">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
            {isArabic ? 'تسوق حسب الفئة' : 'Explore Our Range'}
          </p>
          <h2 className="text-[2rem] font-extrabold leading-tight text-stone-900 sm:text-[2.55rem]">
            {t('sections.categories') || 'Categories'}
          </h2>
        </div>

        <div className="relative mx-auto max-w-[1320px]">
          <div className="category-edge category-edge-left" />
          <div className="category-edge category-edge-right" />

          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
            onClick={() => scrollByAmount('left')}
            disabled={!canScrollLeft}
            className="category-nav category-nav-left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
            onClick={() => scrollByAmount('right')}
            disabled={!canScrollRight}
            className="category-nav category-nav-right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div ref={emblaRef} dir="ltr" className="categories-viewport overflow-hidden">
            <div className="categories-track flex pb-2">
              {renderItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="categories-slide group block min-w-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                >
                <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#d8ded6] bg-[#fffdf9] shadow-[0_12px_30px_rgba(33,30,24,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9d1c7] hover:shadow-[0_18px_36px_rgba(33,30,24,0.08)]">
                  <div className="relative aspect-square overflow-hidden sm:aspect-[5/6]">
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
                  <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-[18px]">
                    <h3 className="line-clamp-1 min-h-[1.45rem] text-center text-[0.92rem] font-semibold leading-[1.45] text-stone-900 transition-colors duration-200 group-hover:text-amber-700">
                      {item.name}
                    </h3>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .categories-viewport {
          cursor: grab;
        }

        .categories-viewport:active {
          cursor: grabbing;
        }

        .categories-track {
          direction: ltr;
          margin-left: -12px;
        }

        .categories-slide {
          flex: 0 0 min(58vw, ${CARD_WIDTH}px);
          margin-left: 12px;
        }

        .category-edge {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10;
          display: none;
          height: 100%;
          width: 34px;
        }

        .category-edge-left {
          left: 0;
          background: linear-gradient(90deg, rgba(255, 253, 249, 0.94), rgba(255, 253, 249, 0));
        }

        .category-edge-right {
          right: 0;
          background: linear-gradient(270deg, rgba(255, 253, 249, 0.94), rgba(255, 253, 249, 0));
        }

        .category-nav {
          position: absolute;
          top: 50%;
          z-index: 20;
          display: none;
          height: 40px;
          width: 40px;
          transform: translateY(-50%);
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(77, 91, 84, 0.2);
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.97);
          color: #445250;
          box-shadow: 0 14px 28px rgba(28, 27, 25, 0.14);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }

        .category-nav:not(:disabled):hover {
          background: #ffffff;
          transform: translateY(-50%) scale(1.04);
        }

        .category-nav:disabled {
          opacity: 0.34;
          cursor: not-allowed;
        }

        .category-nav-left {
          left: 8px;
        }

        .category-nav-right {
          right: 8px;
        }

        @media (min-width: 640px) {
          .categories-track {
            margin-left: -14px;
          }

          .categories-slide {
            flex-basis: ${CARD_WIDTH}px;
            margin-left: 14px;
          }
        }

        @media (min-width: 768px) {
          .category-edge,
          .category-nav {
            display: flex;
          }
        }
      `}</style>
    </section>
  );
};
