import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import useEmblaCarousel from 'embla-carousel-react';
import { useApp } from '../../hooks/useApp';
import { useShopPage } from '../../hooks/useShop';
import { useRegion } from '../../hooks/useRegion';
import { buildResponsiveSrcSet, getCategoryImageUrl, handleImageError } from '../../lib/imageUtils';
import { HOMEPAGE_CARD, HOMEPAGE_CARD_HOVER, HOMEPAGE_HEADER_SPACING, HOMEPAGE_HEADING, homepageContainerClassName, homepageSectionClassName } from './homepageSectionSpacing';

type UnifiedCategoryItem = {
  id: string;
  name: string;
  nameAr?: string;
  image: string;
  href: string;
  group: 'coffee' | 'shop';
};

const CARD_WIDTH = 220;

// Shared by the skeleton and the loaded slider so both lay out identically.
const CATEGORY_STYLES = `
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
          .category-nav {
            display: flex;
          }
        }
      `;

export const UnifiedCategoriesSection: React.FC = () => {
  const { categories, loading: appLoading, language, t } = useApp();
  const { shopData, loading: shopLoading } = useShopPage();
  const { currentRegion } = useRegion();

  const isArabic = language === 'ar';
  // Coffee and shop categories load independently. Render the slider only once
  // both have settled; rendering the first source early made the second one
  // push the cards sideways (CLS). Latched so a later refetch never brings the
  // skeleton back over loaded cards.
  const sourcesPending = (appLoading && categories.length === 0) || (shopLoading && !shopData);
  const [sourcesSettled, setSourcesSettled] = useState(!sourcesPending);
  if (!sourcesPending && !sourcesSettled) {
    setSourcesSettled(true);
  }
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
      href: `/${currentRegion.code}/products?category=${category.id}`,
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

  if (!sourcesSettled) {
    return (
      <section className={homepageSectionClassName('bg-white')}>
        <style>{CATEGORY_STYLES}</style>
        <div className={homepageContainerClassName()}>
          {/* Mirrors the loaded header (eyebrow + heading) so the section keeps its height. */}
          <div className={HOMEPAGE_HEADER_SPACING}>
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200 sm:h-10" />
          </div>
          <div className="categories-track flex overflow-hidden pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              // Mirrors the loaded card: same width, image ratio, radius and title row.
              <div
                key={i}
                className={`categories-slide ${HOMEPAGE_CARD}`}
                aria-hidden="true"
              >
                <div className="aspect-square w-full animate-pulse bg-gray-100 sm:aspect-[5/6]" />
                <div className="flex items-center justify-center p-4 sm:p-[18px]">
                  <div className="flex h-[1.45rem] w-2/3 items-center">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  </div>
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
      <div className={homepageContainerClassName()}>
        <div className={HOMEPAGE_HEADER_SPACING}>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
            {isArabic ? 'تسوق حسب الفئة' : 'Explore Our Range'}
          </p>
          <h2 className={HOMEPAGE_HEADING}>
            {t('sections.categories') || 'Categories'}
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
            onClick={() => scrollByAmount('left')}
            disabled={!canScrollLeft}
            className="category-nav category-nav-left"
          >
            <AnimatedIcon name="chevron-left" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
            onClick={() => scrollByAmount('right')}
            disabled={!canScrollRight}
            className="category-nav category-nav-right"
          >
            <AnimatedIcon name="chevron-right" className="size-5" />
          </button>

          <div ref={emblaRef} dir="ltr" className="categories-viewport overflow-hidden">
            <div className="categories-track flex pb-2">
              {renderItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="categories-slide group block min-w-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                >
                <div className={`flex h-full flex-col ${HOMEPAGE_CARD} ${HOMEPAGE_CARD_HOVER}`}>
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
      <style>{CATEGORY_STYLES}</style>
    </section>
  );
};
