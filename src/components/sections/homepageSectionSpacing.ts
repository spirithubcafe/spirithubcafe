import { cn } from '@/lib/utils';

export const HOMEPAGE_SECTION_SPACING = 'py-10 sm:py-14 lg:py-16';

export const homepageSectionClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_SECTION_SPACING, ...classNames);

/**
 * Single content width for every homepage section (1216px of content on desktop),
 * so all sections line up on the same left/right edges.
 */
export const HOMEPAGE_CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

export const homepageContainerClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_CONTAINER, ...classNames);

/**
 * Section heading typography. New sections use <HomeSectionHeader>, which owns
 * these styles (and its skeleton); these stay for markup that cannot use it.
 */
export const HOMEPAGE_EYEBROW = 'mb-2 flex h-5 items-center gap-2 text-[12px] font-semibold text-[#8b6f47]';
export const HOMEPAGE_HEADING = 'text-[28px] leading-[34px] font-semibold text-stone-900 sm:text-[36px] sm:leading-[44px]';
export const HOMEPAGE_HEADER_SPACING = 'mb-8 sm:mb-10';

/**
 * Shared card surface for homepage cards (matches the homepage ProductCard):
 * solid white, hairline border, a soft lift on hover. No translucency.
 */
export const HOMEPAGE_CARD = 'overflow-hidden rounded-2xl border border-stone-200/70 bg-white';
export const HOMEPAGE_CARD_HOVER = 'transition-shadow duration-300 hover:shadow-[0_16px_36px_-16px_rgba(28,25,23,0.22)]';
