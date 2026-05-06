import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { googleReviewsService, type GoogleReviewsData } from '@/services/googleReviewsService';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_PREVIEW_LENGTH = 140;

const GoogleGIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="#4285F4"
      d="M21.805 12.24c0-.71-.064-1.39-.182-2.04H12v3.86h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.94-1.78 3.045-4.41 3.045-7.46Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.76 0 5.08-.92 6.77-2.5l-3.3-2.56c-.92.62-2.1.99-3.47.99-2.67 0-4.93-1.8-5.74-4.22H2.86v2.65A10 10 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.26 13.72A5.98 5.98 0 0 1 5.94 12c0-.6.1-1.19.32-1.72V7.63H2.86A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.37l3.18-2.65Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.06c1.5 0 2.84.52 3.9 1.52l2.92-2.93C17.07 2.99 14.75 2 12 2A10 10 0 0 0 2.86 7.63l3.4 2.65c.81-2.42 3.07-4.22 5.74-4.22Z"
    />
  </svg>
);

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const filled = idx < rounded;
        return (
          <Star
            key={`star-${idx}`}
            size={size}
            className={filled ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#ddd7c8]'}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};

const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > MAX_PREVIEW_LENGTH;
  const body = text || 'No review text provided.';

  return (
    <div>
      <p className={`text-sm leading-6 text-[#3f4d4c] ${!expanded ? 'line-clamp-1' : ''}`}>{body}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#3f4d4c] underline underline-offset-4 transition-colors hover:text-[#2e3b3b]"
        >
          {expanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
};

export const GoogleReviewsSection: React.FC = () => {
  const [payload, setPayload] = useState<GoogleReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const railRef = React.useRef<HTMLDivElement | null>(null);

  const getNormalizedScroll = React.useCallback((el: HTMLDivElement) => {
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const direction = window.getComputedStyle(el).direction;

    if (direction !== 'rtl') {
      return { position: el.scrollLeft, max, direction };
    }

    if (el.scrollLeft < 0) {
      // Chromium RTL: 0 at right edge, negative values toward left edge.
      return { position: -el.scrollLeft, max, direction };
    }

    // Firefox/Safari RTL: max at right edge, 0 at left edge.
    return { position: max - el.scrollLeft, max, direction };
  }, []);

  const setNormalizedScroll = React.useCallback((el: HTMLDivElement, position: number) => {
    const clamped = Math.max(0, position);
    const { max, direction } = getNormalizedScroll(el);

    if (direction !== 'rtl') {
      el.scrollTo({ left: Math.min(clamped, max), behavior: 'smooth' });
      return;
    }

    const target = Math.min(clamped, max);
    const currentLeft = el.scrollLeft;
    const rawLeft = currentLeft < 0 ? -target : max - target;
    el.scrollTo({ left: rawLeft, behavior: 'smooth' });
  }, [getNormalizedScroll]);

  const updateScrollState = React.useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { position, max } = getNormalizedScroll(el);
    setCanScrollPrev(position > 2);
    setCanScrollNext(position < max - 2);
  }, [getNormalizedScroll]);

  const scrollByPage = (direction: 'prev' | 'next') => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.max(220, Math.round(el.clientWidth * 0.85));
    const { position, max } = getNormalizedScroll(el);
    const target = direction === 'next'
      ? Math.min(max, position + delta)
      : Math.max(0, position - delta);
    setNormalizedScroll(el, target);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await googleReviewsService.getReviews();
        if (!mounted) return;
        setPayload(data);
        setIsError(!data);
      } catch {
        if (!mounted) return;
        setIsError(true);
        setPayload(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(
    () => (payload?.reviews ?? []).filter((review) => review.rating === 5),
    [payload],
  );
  const isArabic =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' || document.documentElement.lang?.toLowerCase().startsWith('ar'));

  useEffect(() => {
    updateScrollState();
    const el = railRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [cards, isLoading, updateScrollState]);

  if (!isLoading && (!payload || cards.length === 0)) {
    return null;
  }

  return (
    <section className="bg-[#fbfbf9] pt-10 pb-0 sm:pt-12 sm:pb-0 lg:pt-14 lg:pb-0">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-7">
          <h2 className="text-2xl font-semibold tracking-[1px] text-[#2E2E2E] md:text-3xl">
            {isArabic ? 'ماذا يقول أصدقاؤنا' : 'WHAT OUR FRIENDS ARE SAYING'}
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-[#b9b8b2]" />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#d9ddd9] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-center gap-2 text-[#3f4d4c]">
                <Spinner className="size-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">Loading Google reviews...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={`review-skeleton-${idx}`} className="h-[190px] rounded-2xl bg-[#e4e8e5]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              className="mb-4 rounded-2xl bg-white p-4 sm:mb-5 sm:p-5"
              style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1.5 flex items-baseline gap-2.5">
                    <span className="text-3xl font-semibold leading-none text-[#2e3b3b]">
                      {payload?.rating.toFixed(1)}
                    </span>
                    <StarRow rating={payload?.rating ?? 0} size={14} />
                  </div>
                  <p className="text-xs text-[#65706d]">
                    {isArabic
                      ? `(${payload?.userRatingsTotal ?? 0} مراجعة)`
                      : `(${payload?.userRatingsTotal ?? 0} reviews)`}
                  </p>
                </div>
                {payload?.reviewWriteUrl && (
                  <a
                    href={payload.reviewWriteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#b04a4a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#963f3f]"
                  >
                    <GoogleGIcon className="h-4 w-4 shrink-0" />
                    {isArabic ? 'قيّمنا على جوجل' : 'Review us on Google'}
                  </a>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => scrollByPage('prev')}
                disabled={!canScrollPrev}
                aria-label="Scroll left"
                className="gr-nav gr-nav-left md:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage('next')}
                disabled={!canScrollNext}
                aria-label="Scroll right"
                className="gr-nav gr-nav-right md:hidden"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div
                ref={railRef}
                className="reviews-rail flex snap-x snap-mandatory gap-3 overflow-x-auto px-10 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0"
              >
                {cards.map((review, index) => (
                  <article
                    key={`${review.authorName}-${review.time}-${index}`}
                    className="w-[calc(100vw-6.5rem)] max-w-[430px] shrink-0 snap-center rounded-2xl bg-[#f5f6f4] p-4 sm:w-[430px] md:w-auto md:max-w-none md:snap-start md:p-5"
                    style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}
                  >
                    <div className="mb-2.5">
                      <h3 className="text-[15px] font-semibold text-[#2e3b3b]">{review.authorName}</h3>
                      <p dir="ltr" className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[#7a847f]">
                        {review.relativeTimeDescription} on Google
                      </p>
                    </div>
                    <div className="mb-3">
                      <StarRow rating={review.rating} size={13} />
                    </div>
                    <ReviewText text={review.text || ''} />
                  </article>
                ))}
              </div>
            </div>
          </>
        )}

        {!isLoading && isError && (
          <p className="mt-4 text-center text-sm text-[#5c6f66]">
            Reviews are temporarily unavailable.
          </p>
        )}
      </div>
      <style>{`
        .reviews-rail {
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .reviews-rail::-webkit-scrollbar {
          display: none;
        }

        .gr-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          height: 32px;
          width: 32px;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.94);
          color: #4b5a58;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
        }

        .gr-nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .gr-nav-left {
          left: 6px;
        }

        .gr-nav-right {
          right: 6px;
        }
      `}</style>
    </section>
  );
};
