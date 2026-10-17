import React from 'react';
import { HOMEPAGE_CONTAINER, homepageSectionClassName } from './homepageSectionSpacing';

interface ProductGridSkeletonProps {
  /** Number of placeholder cards; should match the number of products the section renders. */
  count?: number;
  /** Reserve space for the "View all" button rendered under the grid. */
  withCta?: boolean;
}

/** One placeholder card with the exact size of the homepage `ProductCard` (also used by other product-style cards). */
export const ProductCardSkeleton: React.FC<{ showNotes?: boolean }> = ({ showNotes = true }) => (
  <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm">
    <div className="aspect-square w-full animate-pulse bg-[#fbf8f3]" />
    <div className="flex flex-1 flex-col p-3 pt-1">
      <div className="mb-1 flex min-h-6 items-center">
        <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100" />
      </div>
      <div className={`${showNotes ? 'mb-1' : 'mb-2'} min-h-10 space-y-1.5 pt-0.5`}>
        <div className="h-3.5 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
      {showNotes && (
        <div className="mb-2 flex h-4 items-center">
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
        </div>
      )}
      <div className="mt-auto flex h-[33px] items-end border-t border-stone-100">
        <div className="h-5 w-20 animate-pulse rounded-md bg-gray-100" />
      </div>
    </div>
    {/* Footer: quick-view + add-to-cart buttons (size="sm", h-8) with p-3 pt-0. */}
    <div className="flex gap-2 px-3 pb-3">
      <div className="h-8 w-10 animate-pulse rounded-md bg-gray-100" />
      <div className="h-8 flex-1 animate-pulse rounded-md bg-gray-100" />
    </div>
  </div>
);

/**
 * Loading placeholder for homepage product grids.
 *
 * Every box mirrors the size of the loaded markup (section header and the
 * `ProductCard` "homepage" variant, including the Card's gap-3 and button footer) so swapping the skeleton for real cards
 * does not change the section height and push the page around while scrolling.
 */
export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 6, withCta = false }) => (
  <section className={homepageSectionClassName('bg-white')} aria-busy="true">
    <div className={HOMEPAGE_CONTAINER}>
      {/* Header: eyebrow (text-xs + mb-2) and h2 (text-2xl / sm:text-4xl). */}
      <div className="mb-8 sm:mb-10">
        <div className="mb-2 flex h-4 items-center">
          <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex h-8 items-center sm:h-10">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-gray-200 sm:h-9" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>

      {withCta && (
        <div className="mt-12 flex justify-center">
          <div className="h-11 w-48 animate-pulse rounded-full bg-gray-100" />
        </div>
      )}
    </div>
  </section>
);
