import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import { useApp } from '../../hooks/useApp';
import { cn } from '@/lib/utils';

type HeaderAction = {
  label: string;
  /** Internal route (region-prefixed) or, with `external`, a full URL. */
  to: string;
  external?: boolean;
};

type HomeSectionHeaderProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: HeaderAction;
  /** `dark` for sections on an espresso background. */
  tone?: 'light' | 'dark';
  className?: string;
};

// Fixed line heights so the skeleton below reserves exactly the same box.
const EYEBROW_ROW = 'flex h-5 items-center gap-2';
const TITLE_TYPE = 'mt-2 text-[28px] leading-[34px] sm:text-[36px] sm:leading-[44px]';
const TITLE_SKELETON_BOX = 'mt-2 flex h-[34px] items-center sm:h-[44px]';
const DESCRIPTION_TYPE = 'mt-3 max-w-2xl text-[15px] leading-6';
const DESCRIPTION_SKELETON_BOX = 'mt-3 flex h-6 items-center';
// Never wraps: on phones the action is a round arrow, so the row height is
// always the title block's and the skeleton stays exact.
const HEADER_SPACING = 'mb-8 flex items-end justify-between gap-4 sm:mb-10';

/**
 * The one heading every homepage section uses: eyebrow, title, optional
 * description and an optional "view all" pill. Arabic drops the uppercase and
 * letter-spacing (tracking breaks Arabic letter joining).
 */
export function HomeSectionHeader({ eyebrow, title, description, action, tone = 'light', className }: HomeSectionHeaderProps) {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const dark = tone === 'dark';

  const actionClass = cn(
    'group inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full text-[14px] font-medium ring-1 ring-inset sm:h-10 sm:w-auto sm:px-4 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d]',
    dark ? 'text-white ring-white/20 hover:bg-white/10' : 'text-stone-700 ring-stone-200 hover:bg-stone-100 hover:text-stone-900',
  );
  const actionContent = action && (
    <>
      <span className="hidden sm:inline">{action.label}</span>
      <AnimatedIcon name="arrow-right" className={cn('size-4', isArabic && '-scale-x-100')} />
    </>
  );

  return (
    <div className={cn(HEADER_SPACING, className)}>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            EYEBROW_ROW,
            'text-[12px] font-semibold',
            dark ? 'text-[#e3c196]' : 'text-[#8b6f47]',
            !isArabic && 'uppercase tracking-[0.18em]',
          )}
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#c69c6d]" />
          {eyebrow}
        </p>
        <h2
          className={cn(
            TITLE_TYPE,
            'font-semibold text-balance',
            dark ? 'text-white' : 'text-stone-900',
            !isArabic && 'tracking-[-0.02em]',
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn(DESCRIPTION_TYPE, dark ? 'text-white/65' : 'text-stone-500')}>{description}</p>
        )}
      </div>

      {action &&
        (action.external ? (
          <a href={action.to} target="_blank" rel="noopener noreferrer" aria-label={action.label} className={actionClass}>
            {actionContent}
          </a>
        ) : (
          <Link to={action.to} aria-label={action.label} className={actionClass}>
            {actionContent}
          </Link>
        ))}
    </div>
  );
}

/** Same box as HomeSectionHeader (one-line title), for loading states. */
export function HomeSectionHeaderSkeleton({ withDescription = false, className }: { withDescription?: boolean; className?: string }) {
  return (
    <div className={cn(HEADER_SPACING, className)} aria-hidden="true">
      <div className="min-w-0 flex-1">
        <div className={EYEBROW_ROW}>
          <div className="h-3 w-32 animate-pulse rounded-full bg-stone-200" />
        </div>
        <div className={TITLE_SKELETON_BOX}>
          <div className="h-7 w-56 animate-pulse rounded-lg bg-stone-200 sm:h-9 sm:w-72" />
        </div>
        {withDescription && (
          <div className={DESCRIPTION_SKELETON_BOX}>
            <div className="h-3.5 w-full max-w-md animate-pulse rounded-full bg-stone-100" />
          </div>
        )}
      </div>
    </div>
  );
}
