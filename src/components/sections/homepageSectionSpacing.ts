import { cn } from '@/lib/utils';

export const HOMEPAGE_SECTION_SPACING = 'py-5 sm:py-7 lg:py-8';

export const homepageSectionClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_SECTION_SPACING, ...classNames);
