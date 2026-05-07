import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, ShieldCheck, Star } from 'lucide-react';
import { googleReviewsService, type GoogleReviewsData } from '@/services/googleReviewsService';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_PREVIEW_LENGTH = 160;

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
          className={`mt-2 text-xs font-semibold tracking-[0.04em] text-[#3f4d4c] underline underline-offset-4 transition-colors hover:text-[#2e3b3b] ${isArabic ? 'text-right' : 'uppercase'}`}
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
  const railRef = React.useRef<HTMLDivElement | null>(null);

  const isArabic =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' || document.documentElement.lang?.toLowerCase().startsWith('ar'));

  const updateScrollState = React.useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollPrev(el.scrollLeft > 2);
    setCanScrollNext(el.scrollLeft < max - 2);
  }, []);

  const scrollByPage = (direction: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.max(220, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: direction === 'left' ? -delta : delta, behavior: 'smooth' });
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

  const cards = useMemo(() => (payload?.reviews ?? []).filter((review) => review.rating === 5), [payload]);

  useEffect(() => {
    updateScrollState();
    const el = railRef.current;
    if (!el) return;

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    el.scrollLeft = isArabic ? max : 0;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [cards, isArabic, isLoading, updateScrollState]);

  if (!isLoading && (!payload || cards.length === 0)) return null;

  return (
    <section className="bg-[#fbfbf9] pt-10 pb-0 sm:pt-12 sm:pb-0 lg:pt-14 lg:pb-0" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-7">
          <h2 className="text-2xl font-semibold tracking-[1px] text-[#2E2E2E] md:text-3xl">
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
            <div className="mb-2 rounded-2xl bg-[#FFFDF9] p-4 sm:mb-3 sm:p-5" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(77, 91, 84, 0.12)' }}>
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
                        (<bdi>{payload?.userRatingsTotal ?? 0}</bdi>)
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
                    className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#cf4a35] px-5 py-2 text-xs font-semibold tracking-[0.04em] text-white transition-colors hover:bg-[#b63f2d] ${isArabic ? 'order-1 w-full sm:order-1 sm:w-auto' : 'order-1 w-full sm:w-auto uppercase tracking-[0.08em]'}`}
                  >
                    <GoogleGIcon className="h-4 w-4 shrink-0" />
                    {isArabic ? 'قيّمنا على Google' : 'Review us on Google'}
                  </a>
                )}
              </div>
            </div>

            <div className="relative px-10 md:px-12">
              <button type="button" onClick={() => scrollByPage('left')} disabled={!canScrollPrev} aria-label="Scroll left" className="gr-nav gr-nav-left">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollByPage('right')} disabled={!canScrollNext} aria-label="Scroll right" className="gr-nav gr-nav-right">
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="overflow-hidden">
                <div ref={railRef} className="reviews-rail flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
                  {cards.map((review, index) => (
                    <article
                      key={`${review.authorName}-${review.time}-${index}`}
                      className={`flex h-full w-full min-w-full shrink-0 snap-start flex-col rounded-2xl bg-[#FFFDF9] p-4 md:w-[calc((100%-1rem)/2)] md:min-w-[calc((100%-1rem)/2)] md:max-w-[calc((100%-1rem)/2)] md:p-5 ${isArabic ? 'text-right' : 'text-left'}`}
                      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(77, 91, 84, 0.12)' }}
                    >
                      <div className={`mb-2.5 flex items-center gap-2.5 ${isArabic ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
                        <ReviewAvatar name={review.authorName} src={review.profilePhotoUrl} />
                        <div className={isArabic ? 'min-h-[40px] text-right' : 'min-h-[40px] text-left'}>
                          <h3 className="truncate text-[15px] font-semibold leading-5 text-[#2e3b3b]">{review.authorName}</h3>
                          <p dir="ltr" className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#7a847f]">{review.relativeTimeDescription} on Google</p>
                        </div>
                      </div>
                      <div className={`mb-3 ${isArabic ? 'flex justify-end' : ''}`}>
                        <StarRow rating={review.rating} size={13} />
                      </div>
                      <div className="mt-auto px-1 sm:px-0">
                        <ReviewText text={review.text || ''} isArabic={isArabic} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && isError && <p className="mt-4 text-center text-sm text-[#5c6f66]">Reviews are temporarily unavailable.</p>}
      </div>

      <style>{`
        .reviews-rail {
          direction: ltr;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
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
          background: rgba(255, 255, 255, 0.45);
          color: #4b5a58;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .gr-nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .gr-nav:not(:disabled):hover {
          background: rgba(255, 255, 255, 0.72);
          color: #2f3b38;
        }

        .gr-nav-left {
          left: 8px;
        }

        .gr-nav-right {
          right: 8px;
        }

        @media (max-width: 768px) {
          .gr-nav-left {
            left: 6px;
          }

          .gr-nav-right {
            right: 6px;
          }
        }
      `}</style>
    </section>
  );
};
