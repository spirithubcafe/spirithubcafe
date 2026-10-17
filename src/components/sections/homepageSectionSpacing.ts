import { cn } from '@/lib/utils';

export const HOMEPAGE_SECTION_SPACING = 'py-5 sm:py-7 lg:py-8';

export const homepageSectionClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_SECTION_SPACING, ...classNames);

/**
 * Single content width for every homepage section (1216px of content on desktop),
 * so all sections line up on the same left/right edges.
 */
export const HOMEPAGE_CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

export const homepageContainerClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_CONTAINER, ...classNames);

/** Shared section heading typography (eyebrow line + title). */
export const HOMEPAGE_EYEBROW = 'mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600';
export const HOMEPAGE_HEADING = 'text-2xl font-extrabold text-stone-900 sm:text-4xl';
export const HOMEPAGE_HEADER_SPACING = 'mb-8 sm:mb-10';

/**
 * Shared card surface for homepage cards (matches the homepage ProductCard):
 * solid white, hairline border, soft shadow. No translucency or edge fades.
 */
export const HOMEPAGE_CARD = 'overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm';
export const HOMEPAGE_CARD_HOVER = 'transition-shadow duration-300 hover:shadow-md';
