import { cn } from '@/lib/utils';

export const HOMEPAGE_SECTION_SPACING = 'py-8 sm:py-10 lg:py-12';

export const homepageSectionClassName = (...classNames: Array<string | false | null | undefined>) =>
  cn(HOMEPAGE_SECTION_SPACING, ...classNames);
