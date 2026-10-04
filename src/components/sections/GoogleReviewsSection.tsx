import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { googleReviewsService, type GoogleReviewsData } from '@/services/googleReviewsService';
import { Skeleton } from '@/components/ui/skeleton';
import { homepageSectionClassName } from './homepageSectionSpacing';

const MAX_PREVIEW_LENGTH = 72;
const REVIEW_PANEL_IMAGE = '/images/slides/rwanda-farm-spirithub-coffee.webp';

const ARABIC_TEXT_REGEX = /[\u0600-\u06FF]/;

const formatReviewDateLabel = (timeValue: number | undefined, isArabic: boolean): string | null => {
  if (typeof timeValue !== 'number' || Number.isNaN(timeValue) || timeValue <= 0) {
    return null;
  }

  const epochMs = timeValue < 1_000_000_000_000 ? timeValue * 1000 : timeValue;
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(isArabic ? 'ar' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getReviewLocation = (review: unknown): string | null => {
  if (!review || typeof review !== 'object') {
    return null;
  }

  const record = review as Record<string, unknown>;
  const location = record.location;
  return typeof location === 'string' && location.trim().length > 0 ? location.trim() : null;
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
          className={idx < rounded ? 'fill-[#C99A3D] text-[#C99A3D]' : 'text-[#e4dccf]'}
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
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(93,67,45,0.10)] bg-[#f7efe2] text-[11px] font-semibold text-[#5a4e43] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const ReviewText: React.FC<{ text: string; isArabic: boolean }> = ({ text, isArabic }) => {
  const [expanded, setExpanded] = useState(false);
  const body = text.trim();

  if (!body) return null;

  const isLong = body.length > MAX_PREVIEW_LENGTH;
  const preview = isLong ? `${body.slice(0, MAX_PREVIEW_LENGTH).trimEnd()}...` : body;
  const isArabicReview = ARABIC_TEXT_REGEX.test(body);

  return (
    <div className={isArabic ? 'text-right' : 'text-left'}>
      <p
        dir={isArabicReview ? 'rtl' : 'ltr'}
        className={`text-[15px] leading-[1.6] lg:text-[14px] lg:leading-[1.55] text-[#3B2A20] ${
          isArabicReview ? 'text-right' : 'text-left'
        }`}
        style={{ unicodeBidi: 'plaintext' }}
      >
        “{expanded ? body : preview}”
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`mt-2 text-xs font-semibold tracking-[0.02em] text-[#7a6655] underline underline-offset-4 transition-colors hover:text-[#4e4035] ${isArabic ? 'text-right' : 'uppercase'}`}
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
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
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
    const handleReInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      updateScrollState();
    };
    setScrollSnaps(emblaApi.scrollSnapList());
    updateScrollState();
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', handleReInit);

    return () => {
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', handleReInit);
    };
  }, [emblaApi, updateScrollState]);

  useEffect(() => {
    emblaApi?.reInit();
    updateScrollState();
  }, [cards.length, emblaApi, updateScrollState]);

  useEffect(() => {
    if (!emblaApi || cards.length === 0) return;
    emblaApi.scrollTo(0, true);
    updateScrollState();
  }, [cards.length, emblaApi, updateScrollState]);

  if (!isLoading && (!payload || cards.length === 0)) return null;

  return (
    <section className={homepageSectionClassName('bg-[#fbfbf9]')} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[26px] border border-[rgba(123,96,67,0.14)] bg-[#f7f2e9] shadow-[0_18px_44px_rgba(88,63,34,0.10)] lg:min-h-[396px]"
          style={{ direction: isArabic ? 'rtl' : 'ltr' }}
        >
          <div className="absolute inset-0">
            <img
              src={REVIEW_PANEL_IMAGE}
              alt=""
              className={`h-full w-full object-cover object-[18%_center] ${isArabic ? 'lg:-scale-x-100' : ''}`}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div
            className={`absolute inset-0 hidden lg:block ${
              isArabic
                ? 'bg-[linear-gradient(270deg,rgba(9,19,11,0.84)_0%,rgba(18,29,17,0.74)_23%,rgba(44,40,29,0.44)_38%,rgba(92,79,55,0.20)_47%,rgba(247,242,233,0.52)_58%,rgba(247,242,233,0.92)_74%,rgba(247,242,233,1)_100%)]'
                : 'bg-[linear-gradient(90deg,rgba(9,19,11,0.84)_0%,rgba(18,29,17,0.74)_23%,rgba(44,40,29,0.44)_38%,rgba(92,79,55,0.20)_47%,rgba(247,242,233,0.52)_58%,rgba(247,242,233,0.92)_74%,rgba(247,242,233,1)_100%)]'
            }`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,19,11,0.86)_0%,rgba(18,29,17,0.80)_52%,rgba(44,40,29,0.52)_60%,rgba(247,242,233,0.90)_70%,rgba(247,242,233,1)_100%)] lg:hidden" />
          <div
            className={`absolute inset-0 hidden lg:block ${
              isArabic
                ? 'bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.62),rgba(255,255,255,0)_22%),radial-gradient(circle_at_83%_24%,rgba(255,255,255,0.10),rgba(255,255,255,0)_24%)]'
                : 'bg-[radial-gradient(circle_at_72%_16%,rgba(255,255,255,0.62),rgba(255,255,255,0)_22%),radial-gradient(circle_at_17%_24%,rgba(255,255,255,0.10),rgba(255,255,255,0)_24%)]'
            }`}
          />

          {isLoading ? (
            <div className="relative grid lg:min-h-[396px] lg:grid-cols-[37%_63%]">
              <div className="px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#dfbe7a]">
                      <span className="h-px w-6 bg-[#dfbe7a]/80" aria-hidden="true" />
                      <Skeleton className="h-3 w-28 bg-white/20" />
                    </div>
                    <Skeleton className="h-12 w-4/5 bg-white/20" />
                    <Skeleton className="h-12 w-2/3 bg-white/20" />
                    <Skeleton className="h-5 w-full bg-white/15" />
                    <Skeleton className="h-5 w-4/5 bg-white/15" />
                  </div>
                  <Skeleton className="h-12 w-[248px] rounded-full bg-white/20" />
                </div>
                <div className="mt-12">
                  <Skeleton className="h-14 w-48 bg-white/20" />
                  <Skeleton className="mt-3 h-5 w-40 bg-white/15" />
                </div>
              </div>

              <div className="px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`review-skeleton-${idx}`}
                      className="min-h-[230px] rounded-[22px] border border-[rgba(93,67,45,0.08)] bg-[rgba(255,252,247,0.78)] p-5 shadow-[0_8px_24px_rgba(59,42,32,0.06)] backdrop-blur-[10px]"
                    >
                      <div className="mb-6 flex items-start justify-between gap-3">
                        <Skeleton className="h-12 w-12 rounded-2xl bg-[#efe6d8]" />
                        <Skeleton className="h-5 w-24 rounded-full bg-[#efe6d8]" />
                      </div>
                      <Skeleton className="mb-3 h-5 w-full bg-[#efe6d8]" />
                      <Skeleton className="mb-3 h-5 w-5/6 bg-[#efe6d8]" />
                      <Skeleton className="mb-10 h-5 w-3/4 bg-[#efe6d8]" />
                      <div className="mt-auto flex items-start gap-3">
                        <Skeleton className="h-11 w-11 rounded-full bg-[#efe6d8]" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-28 bg-[#efe6d8]" />
                          <Skeleton className="h-3 w-20 bg-[#efe6d8]" />
                          <Skeleton className="h-3 w-24 bg-[#efe6d8]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative grid grid-cols-[minmax(0,1fr)] lg:min-h-[396px] lg:grid-cols-[37%_63%]">
              <div className="px-6 py-8 sm:px-8 sm:py-9 lg:flex lg:flex-col lg:justify-center lg:px-8 lg:py-7">
                <div className="max-w-[400px] rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,10,0.52),rgba(17,24,17,0.26))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.16)] backdrop-blur-[10px] sm:p-6 lg:p-6">
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#dfbe7a]">
                          <span className="h-px w-6 bg-[#dfbe7a]/80" aria-hidden="true" />
                          {isArabic ? 'حب عملائنا' : 'Customer Love'}
                        </p>
                        <h2
                          className={`text-[2.2rem] leading-[1.02] text-[#fffdf8] sm:text-[2.4rem] lg:text-[2rem] xl:text-[2.25rem] ${
                            isArabic ? 'max-w-[11ch] font-bold' : 'max-w-[350px] font-extrabold tracking-[-0.03em]'
                          }`}
                        >
                          {isArabic ? 'ماذا يقول عملاؤنا' : 'What Our Friends Are Saying'}
                        </h2>
                        <p className="max-w-sm text-[15px] leading-7 text-white/88 sm:text-[16px] lg:text-[15px] lg:leading-6">
                          {isArabic
                            ? 'استمع إلى آراء مجتمعنا في عُمان والسعودية ومن جميع أنحاء المنطقة.'
                            : 'Hear from our community in Oman, Saudi Arabia and around the world.'}
                        </p>
                      </div>

                      {payload?.reviewWriteUrl && (
                        <a
                          href={payload.reviewWriteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/18 bg-white px-5 py-3 text-sm font-semibold text-[#2d2a23] shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3] sm:min-w-[248px] lg:min-h-[44px] lg:min-w-[224px] lg:py-2.5"
                        >
                          <GoogleGIcon className="h-4 w-4 shrink-0" />
                          {isArabic ? 'قيّمنا على Google' : 'Review Us on Google'}
                          <ChevronRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-white">
                      <span className="text-[2.5rem] font-bold leading-none lg:text-[2.2rem]">{payload?.rating.toFixed(1)}</span>
                      <StarRow rating={payload?.rating ?? 0} size={16} />
                      <span className="text-[17px] text-white/84 lg:text-[15px]">
                        {isArabic
                          ? `(${formattedRatingsCount} مراجعة)`
                          : `(${payload?.userRatingsTotal ?? 0} reviews)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`relative min-w-0 px-4 py-6 sm:px-6 sm:py-7 lg:ps-7 lg:pe-6 lg:py-6 xl:ps-[54px] ${isArabic ? 'reviews-rtl' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => scrollByPage('left')}
                  disabled={!canScrollPrev}
                  aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
                  className="gr-nav gr-nav-left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByPage('right')}
                  disabled={!canScrollNext}
                  aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
                  className="gr-nav gr-nav-right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="reviews-stage flex h-full flex-col justify-center">
                  <div ref={emblaRef} className="reviews-viewport -mb-6 -mt-4 overflow-hidden pb-6 pt-4">
                    <div className="reviews-rail flex items-stretch pb-1">
                      {cards.map((review, index) => {
                        const displayDate =
                          formatReviewDateLabel(review.time, isArabic) ||
                          review.relativeTimeDescription ||
                          (isArabic ? 'مراجعة على Google' : 'Google review');

                        const reviewLocation = getReviewLocation(review);

                        return (
                          <div
                            key={`${review.authorName}-${review.time}-${index}`}
                            className="reviews-slide min-w-0 shrink-0"
                          >
                            <article className="review-card flex h-full flex-col rounded-[22px] border border-[rgba(93,67,45,0.1)] bg-[rgba(252,247,240,0.84)] p-5 lg:p-[18px] shadow-[0_10px_28px_rgba(59,42,32,0.08)] backdrop-blur-[14px]">
                              <div className={`flex items-start gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="-mt-1 w-9 shrink-0 font-serif text-[56px] font-bold leading-none text-[#d8c4a7] lg:w-8 lg:text-[48px]" aria-hidden="true">
                                  “
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`flex pt-1 ${isArabic ? 'justify-end' : ''}`}>
                                    <StarRow rating={review.rating} size={14} />
                                  </div>
                                  <div className="mt-3">
                                    <ReviewText text={review.text} isArabic={isArabic} />
                                  </div>
                                </div>
                              </div>

                              <div className={`mt-auto flex items-start gap-3 pt-4 lg:pt-3 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                                <div className="[&>div]:h-[46px] [&>div]:w-[46px] [&>img]:h-[46px] [&>img]:w-[46px] lg:[&>div]:h-10 lg:[&>div]:w-10 lg:[&>img]:h-10 lg:[&>img]:w-10">
                                  <ReviewAvatar name={review.authorName} src={review.profilePhotoUrl} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="truncate text-[14px] font-semibold text-[#2B211B]">{review.authorName}</h3>
                                  <p className="mt-1 text-xs text-[#8B7B6B]">{displayDate}</p>
                                  {reviewLocation ? (
                                    <div className={`mt-1.5 flex items-center gap-1.5 text-[12px] text-[#8B7B6B] ${isArabic ? 'justify-end' : ''}`}>
                                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C99A3D]" />
                                      <span>{reviewLocation}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </article>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {scrollSnaps.length > 1 && (
                    <div className="mt-[23px] lg:mt-[18px] flex items-center justify-center gap-2">
                      {scrollSnaps.map((_, index) => (
                        <button
                          key={`review-dot-${index}`}
                          type="button"
                          aria-label={isArabic ? `الانتقال إلى المراجعة ${index + 1}` : `Go to review ${index + 1}`}
                          aria-pressed={selectedIndex === index}
                          onClick={() => emblaApi?.scrollTo(index)}
                          className={`h-2 rounded-full transition-all ${
                            selectedIndex === index ? 'w-5 bg-[#7a6655]' : 'w-2 bg-[#d5c7b4] hover:bg-[#bda992]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isLoading && isError && (
          <p className="mt-4 text-center text-sm text-[#5c6f66]">
            {isArabic ? 'المراجعات غير متاحة مؤقتًا.' : 'Reviews are temporarily unavailable.'}
          </p>
        )}
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
          margin-left: -10px;
        }

        .reviews-slide {
          flex: 0 0 calc(100% - 10px);
          margin-left: 10px;
        }

        .gr-nav {
          position: absolute;
          top: 50%;
          z-index: 20;
          display: inline-flex;
          height: 42px;
          width: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(125, 100, 72, 0.22);
          background: rgba(255, 255, 255, 0.97);
          color: #5d4b3d;
          box-shadow: 0 14px 30px rgba(76, 57, 36, 0.14);
          transform: translateY(-50%);
          transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }

        .gr-nav:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .gr-nav:not(:disabled):hover {
          background: #ffffff;
          color: #35291f;
          transform: translateY(-50%) scale(1.04);
        }

        .gr-nav-left {
          left: 10px;
        }

        .gr-nav-right {
          right: 10px;
        }

        @media (max-width: 1023px) {
          .gr-nav {
            top: auto;
            bottom: 7px;
            transform: none;
          }

          .gr-nav:not(:disabled):hover {
            transform: scale(1.04);
          }
        }

        @media (max-width: 639px) {
          .reviews-rail {
            margin-left: -10px;
          }

          .reviews-slide {
            flex-basis: calc(88% - 10px);
            margin-left: 10px;
          }

          .gr-nav {
            height: 34px;
            width: 34px;
            bottom: 11px;
          }
        }

        @media (min-width: 640px) {
          .reviews-slide {
            flex-basis: calc(62% - 10px);
          }
        }

        @media (min-width: 768px) {
          .reviews-slide {
            flex-basis: calc(49% - 10px);
          }
        }

        @media (min-width: 1024px) {
          .reviews-slide {
            flex-basis: calc(35.2% - 10px);
          }

          /* Column padding: start 28px, end 24px; arrow is 38px wide, so offset = padding - 19px */
          .gr-nav {
            height: 38px;
            width: 38px;
          }

          .gr-nav-left {
            left: 9px;
          }

          .gr-nav-right {
            right: 5px;
          }

          .reviews-rtl .gr-nav-left {
            left: 5px;
          }

          .reviews-rtl .gr-nav-right {
            right: 9px;
          }
        }

        @media (min-width: 1280px) {
          .reviews-slide {
            flex-basis: calc(33.333% - 10px);
          }

          /* xl column padding: start 54px, end 24px */
          .gr-nav-left {
            left: 35px;
          }

          .gr-nav-right {
            right: 5px;
          }

          .reviews-rtl .gr-nav-left {
            left: 5px;
          }

          .reviews-rtl .gr-nav-right {
            right: 35px;
          }
        }
      `}</style>
    </section>
  );
};
