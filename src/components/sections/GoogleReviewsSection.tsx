import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, ShieldCheck, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { googleReviewsService, type GoogleReviewsData } from '@/services/googleReviewsService';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_PREVIEW_LENGTH = 160;

const formatReviewDateTime = (timeValue: number | undefined, isArabic: boolean): string | null => {
  if (typeof timeValue !== 'number' || Number.isNaN(timeValue) || timeValue <= 0) {
    return null;
  }

  // Google APIs may return epoch seconds; convert to ms when needed.
  const epochMs = timeValue < 1_000_000_000_000 ? timeValue * 1000 : timeValue;
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Use a digits-only LTR date format in Arabic UI to avoid bidi reordering issues.
  const locale = isArabic ? 'en-GB' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const GoogleGIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path fill="#4285F4" d="M21.805 12.24c0-.71-.064-1.39-.182-2.04H12v3.86h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.94-1.78 3.045-4.41 3.045-7.46Z" />
    <path fill="#34A853" d="M12 22c2.76 0 5.08-.92 6.77-2.5l-3.3-2.56c-.92.62-2.1.99-3.47.99-2.67 0-4.93-1.8-5.74-4.22H2.86v2.65A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.26 13.72A5.98 5.98 0 0 1 5.94 12c0-.6.1-1.19.32-1.72V7.63H2.86A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.37l3.18-2.65Z" />
    <path fill="#EA4335" d="M12 6.06c1.5 0 2.84.52 3.9 1.52l2.92-2.93C17.07 2.99 14.75 2 12 2A10 10 0 0 0 2.86 7.63l3.4 2.65c.81-2.42 3.07-4.22 5.74-4.22Z" />
  </svg>
);

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={`star-${idx}`}
          size={size}
          className={idx < rounded ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#ddd7c8]'}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const ReviewAvatar: React.FC<{ name: string; src?: string }> = ({ name, src }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

  if (!src || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe4dd] text-[11px] font-semibold text-[#4d5b54]" aria-label={name}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const ReviewText: React.FC<{ text: string; isArabic: boolean }> = ({ text, isArabic }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > MAX_PREVIEW_LENGTH;
  const body = text || (isArabic ? 'لا يوجد نص للمراجعة.' : 'No review text provided.');
  const preview = isLong ? `${body.slice(0, MAX_PREVIEW_LENGTH).trimEnd()}...` : body;

  return (
    <div>
      <p dir="ltr" className="text-left text-sm leading-6 text-[#3f4d4c]" style={{ unicodeBidi: 'plaintext' }}>
        {expanded ? body : preview}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`mt-2 text-xs font-semibold tracking-[0.02em] text-[#3f4d4c] underline underline-offset-4 transition-colors hover:text-[#2e3b3b] ${isArabic ? 'text-right' : 'uppercase'}`}
        >
          {expanded ? (isArabic ? 'عرض أقل' : 'Read Less') : (isArabic ? 'اقرأ المزيد' : 'Read More')}
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
  });

  const isArabic =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' || document.documentElement.lang?.toLowerCase().startsWith('ar'));

  const updateScrollState = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollByPage = React.useCallback((direction: 'left' | 'right') => {
    if (!emblaApi) return;
    if (direction === 'left') {
      emblaApi.scrollPrev();
      return;
    }
    emblaApi.scrollNext();
  }, [emblaApi]);

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

  const cards = useMemo(() => payload?.reviews ?? [], [payload]);
  const formattedRatingsCount = useMemo(() => {
    const count = payload?.userRatingsTotal ?? 0;
    if (!isArabic) return String(count);
    return new Intl.NumberFormat('ar').format(count);
  }, [isArabic, payload?.userRatingsTotal]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollState();
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', updateScrollState);

    return () => {
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  useEffect(() => {
    emblaApi?.reInit();
    updateScrollState();
  }, [cards.length, emblaApi, updateScrollState]);

  useEffect(() => {
    if (!emblaApi || cards.length === 0) return;
    // Keep initial position consistent across locales: start at first (newest) card.
    emblaApi.scrollTo(0, true);
    updateScrollState();
  }, [cards.length, emblaApi, updateScrollState]);

  if (!isLoading && (!payload || cards.length === 0)) return null;

  return (
    <section className="bg-[#fbfbf9] pt-10 pb-0 sm:pt-12 sm:pb-0 lg:pt-14 lg:pb-0" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-7">
          <h2 className="text-[22px] font-semibold tracking-[1px] text-[#2E2E2E] md:text-[28px]">
            {isArabic ? 'ماذا يقول عملاؤنا' : 'WHAT OUR FRIENDS ARE SAYING'}
          </h2>
          <p className="mt-2 text-sm text-[#5f6a65]">
            {isArabic ? 'آراء حقيقية من عملاء سبيريت هب على Google' : 'Real reviews from Spirit Hub customers on Google'}
          </p>
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
            <div className="mb-4 rounded-2xl bg-[#FFFDF9] p-4 sm:mb-5 sm:p-5 lg:mx-auto lg:max-w-[1320px]" style={{ boxShadow: '0 16px 42px rgba(0,0,0,0.06)', border: '1px solid rgba(77, 91, 84, 0.12)' }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className={isArabic ? 'order-2 sm:order-2 sm:text-right' : 'order-2 sm:order-1'}>
                  <div dir="ltr" className={`mb-1.5 flex items-center gap-2.5 ${isArabic ? 'justify-end' : ''}`}>
                    <span className="text-3xl font-semibold leading-none text-[#2e3b3b]">{payload?.rating.toFixed(1)}</span>
                    <span className="inline-flex items-center gap-1 text-[#4D5B54]" aria-label="Verified and trusted">
                      <BadgeCheck className="h-4 w-4" />
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <StarRow rating={payload?.rating ?? 0} size={14} />
                    {isArabic ? (
                      <span dir="rtl" className="text-xs text-[#65706d] whitespace-nowrap" style={{ unicodeBidi: 'plaintext' }}>
                        (<bdi>{formattedRatingsCount}</bdi>)
                      </span>
                    ) : (
                      <span className="text-xs text-[#65706d] whitespace-nowrap">({payload?.userRatingsTotal ?? 0} reviews)</span>
                    )}
                  </div>
                </div>

                {payload?.reviewWriteUrl && (
                  <a
                    href={payload.reviewWriteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full bg-[#cf4a35] px-5 py-1.5 text-xs font-semibold tracking-[0.04em] text-white transition-colors hover:bg-[#b63f2d] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b63f2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbf9] ${isArabic ? 'order-1 w-full sm:order-1 sm:w-auto' : 'order-1 w-full sm:w-auto uppercase tracking-[0.08em]'}`}
                  >
                    <GoogleGIcon className="h-4 w-4 shrink-0" />
                    {isArabic ? 'قيّمنا على Google' : 'Review us on Google'}
                  </a>
                )}
              </div>
            </div>

            <div className="relative mx-auto max-w-[1320px] px-10 md:px-12">
              <div className="review-edge review-edge-left" />
              <div className="review-edge review-edge-right" />
              <button type="button" onClick={() => scrollByPage('left')} disabled={!canScrollPrev} aria-label="Scroll left" className="gr-nav gr-nav-left">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollByPage('right')} disabled={!canScrollNext} aria-label="Scroll right" className="gr-nav gr-nav-right">
                <ChevronRight className="h-4 w-4" />
              </button>

              <div ref={emblaRef} className="reviews-viewport overflow-hidden">
                <div className="reviews-rail flex pb-1">
                  {cards.map((review, index) => {
                    const displayTime =
                      formatReviewDateTime(review.time, isArabic) ||
                      `${review.relativeTimeDescription} on Google`;

                    return (
                    <article
                      key={`${review.authorName}-${review.time}-${index}`}
                      className={`reviews-slide flex h-full min-w-0 shrink-0 flex-col rounded-2xl bg-[#FFFDF9] p-4 md:p-5 ${isArabic ? 'text-right' : 'text-left'}`}
                      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(77, 91, 84, 0.12)' }}
                    >
                      <div className={`mb-2.5 flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
                        <ReviewAvatar name={review.authorName} src={review.profilePhotoUrl} />
                        <div className={isArabic ? 'min-h-[40px] text-right' : 'min-h-[40px] text-left'}>
                          <h3 className="truncate text-[15px] font-medium leading-5 text-[#2e3b3b]">{review.authorName}</h3>
                          <p
                            dir="ltr"
                            className="mt-1 text-[11px] tracking-[0.02em] text-[#5f6b66]"
                            style={{ unicodeBidi: 'plaintext' }}
                          >
                            <bdi>{displayTime}</bdi>
                          </p>
                        </div>
                      </div>
                      <div className={`mb-3 ${isArabic ? 'flex justify-end' : ''}`}>
                        <StarRow rating={review.rating} size={13} />
                      </div>
                      <div className="mt-auto">
                        <ReviewText text={review.text || ''} isArabic={isArabic} />
                      </div>
                    </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && isError && <p className="mt-4 text-center text-sm text-[#5c6f66]">Reviews are temporarily unavailable.</p>}
      </div>

      <style>{`
        .reviews-viewport {
          cursor: grab;
        }

        .reviews-viewport:active {
          cursor: grabbing;
        }

        .reviews-rail {
          direction: ltr;
          margin-left: -16px;
        }

        .reviews-slide {
          flex: 0 0 100%;
          margin-left: 16px;
          min-height: 220px;
        }

        .review-edge {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10;
          display: none;
          height: 100%;
          width: 26px;
        }

        .review-edge-left {
          left: 40px;
          background: linear-gradient(90deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .review-edge-right {
          right: 40px;
          background: linear-gradient(270deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .gr-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          height: 36px;
          width: 36px;
          border: 1px solid rgba(77, 91, 84, 0.14);
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.88);
          color: #4b5a58;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .gr-nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .gr-nav:not(:disabled):hover {
          background: #fffdf9;
          color: #2f3b38;
          transform: translateY(-50%) scale(1.04);
        }

        .gr-nav-left {
          left: 10px;
        }

        .gr-nav-right {
          right: 10px;
        }

        @media (max-width: 768px) {
          .reviews-rail {
            margin-left: -12px;
          }

          .reviews-slide {
            margin-left: 12px;
          }

          .gr-nav {
            height: 30px;
            width: 30px;
          }

          .gr-nav-left {
            left: 12px;
          }

          .gr-nav-right {
            right: 12px;
          }
        }

        @media (min-width: 768px) {
          .review-edge {
            display: block;
          }

          .reviews-slide {
            flex-basis: calc(50% - 8px);
          }
        }
      `}</style>
    </section>
  );
};
