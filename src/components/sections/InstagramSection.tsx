import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

type InstagramPost = {
  id: string;
  mediaType: InstagramMediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
  timestamp?: string;
  isPinned?: boolean;
};

type FeedResponse = {
  success?: boolean;
  data?: {
    posts?: InstagramPost[];
    fromCacheFallback?: boolean;
  };
  message?: string;
};

const MAX_POSTS = 12;
const FETCH_POSTS = 25;
const DEBUG_INSTAGRAM = import.meta.env.DEV && import.meta.env.VITE_DEBUG_INSTAGRAM === 'true';

const getPinnedPermalinkSet = (): Set<string> => {
  const configured = import.meta.env.VITE_INSTAGRAM_PINNED_PERMALINKS;
  if (typeof configured !== 'string' || configured.trim().length === 0) {
    return new Set();
  }
  return new Set(
    configured
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
};

const isValidMediaType = (value: unknown): value is InstagramMediaType =>
  value === 'IMAGE' || value === 'VIDEO' || value === 'CAROUSEL_ALBUM';

const normalizePosts = (payload: unknown): InstagramPost[] => {
  const items: unknown[] = Array.isArray(payload) ? payload : [];
  const skipped: Array<{ id: string; reason: string }> = [];

  const normalized = items
    .map((raw) => {
      if (!raw || typeof raw !== 'object') {
        skipped.push({ id: 'unknown', reason: 'invalid item shape' });
        return null;
      }
      const item = raw as Record<string, unknown>;
      const mediaType = item.mediaType;
      const permalink = typeof item.permalink === 'string' ? item.permalink : '';
      const id = String(item.id ?? permalink ?? 'unknown');

      if (!isValidMediaType(mediaType) || !permalink) {
        skipped.push({
          id,
          reason: !isValidMediaType(mediaType) ? `unsupported mediaType: ${String(mediaType)}` : 'missing permalink',
        });
        return null;
      }

      return {
        id,
        mediaType,
        mediaUrl: typeof item.mediaUrl === 'string' ? item.mediaUrl : undefined,
        thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl : undefined,
        permalink,
        caption: typeof item.caption === 'string' ? item.caption : undefined,
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : undefined,
        isPinned: typeof item.isPinned === 'boolean' ? item.isPinned : undefined,
      } as InstagramPost;
    })
    .filter((post): post is InstagramPost => post !== null);

  if (DEBUG_INSTAGRAM && skipped.length > 0) {
    console.info('[InstagramSection] Skipped posts during normalize', skipped);
  }

  const configuredPinnedPermalinks = getPinnedPermalinkSet();
  const sorted = normalized
    .sort((a, b) => {
      const aPinned = Boolean(a.isPinned) || configuredPinnedPermalinks.has(a.permalink);
      const bPinned = Boolean(b.isPinned) || configuredPinnedPermalinks.has(b.permalink);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      const aTs = a.timestamp ? Date.parse(a.timestamp) : 0;
      const bTs = b.timestamp ? Date.parse(b.timestamp) : 0;
      return bTs - aTs;
    });

  if (DEBUG_INSTAGRAM && configuredPinnedPermalinks.size > 0) {
    const matchedConfiguredPins = sorted.filter((post) => configuredPinnedPermalinks.has(post.permalink)).length;
    console.info('[InstagramSection] Pinned post matching', {
      configuredCount: configuredPinnedPermalinks.size,
      matchedConfiguredPins,
    });
  }

  return sorted.slice(0, MAX_POSTS);
};

export const InstagramSection: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const updateScrollState = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollByPage = React.useCallback((direction: 'prev' | 'next') => {
    if (!emblaApi) return;
    if (direction === 'prev') {
      emblaApi.scrollPrev();
      return;
    }
    emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const controller = new AbortController();

    const loadFeed = async () => {
      try {
        const response = await fetch(`/api/instagram/feed?postLimit=${FETCH_POSTS}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Feed request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as FeedResponse;
        const parsedPosts = normalizePosts(payload?.data?.posts);
        const apiCount = Array.isArray(payload?.data?.posts) ? payload.data.posts.length : 0;
        if (DEBUG_INSTAGRAM) {
          console.info('[InstagramSection] API count', { apiCount });
        }
        setPosts(parsedPosts);
        setHasError(payload?.success === false);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setHasError(true);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFeed();

    return () => controller.abort();
  }, []);

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
  }, [posts.length, isLoading, emblaApi, updateScrollState]);

  useEffect(() => {
    if (isLoading) return;
    const renderedCount = posts.filter((post) => {
      const imageUrl = post.mediaType === 'VIDEO' ? (post.thumbnailUrl || post.mediaUrl) : post.mediaUrl;
      return Boolean(imageUrl);
    }).length;
    if (DEBUG_INSTAGRAM) {
      console.info('[InstagramSection] Rendered count', { renderedCount, totalNormalized: posts.length });
    }
  }, [posts, isLoading]);

  const showFallback = hasError || (!isLoading && posts.length === 0);

  const skeletonCards = useMemo(() => Array.from({ length: 7 }), []);
  const isArabic =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' || document.documentElement.lang?.toLowerCase().startsWith('ar'));

  return (
    <section className="bg-[#fbfbf9] pb-12 pt-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-11">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-[22px] font-semibold tracking-[1px] text-[#2E2E2E] md:text-[28px]">
            {isArabic ? 'زوروا إنستغرامنا' : 'VISIT OUR INSTAGRAM'}
          </h2>
          <div className="mx-auto mt-4 h-px w-12 bg-[#b9b8b2]" />
        </div>

        <div className="mx-auto w-full max-w-[1320px]">
          <div className="relative">
            <div className="ig-edge ig-edge-left" />
            <div className="ig-edge ig-edge-right" />
            <button
              type="button"
              onClick={() => scrollByPage('prev')}
              disabled={!canScrollPrev}
              aria-label="Scroll left"
              className="ig-nav ig-nav-left"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage('next')}
              disabled={!canScrollNext}
              aria-label="Scroll right"
              className="ig-nav ig-nav-right"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div ref={emblaRef} className="instagram-viewport overflow-hidden">
              <div className="instagram-strip flex pb-2">
            {isLoading &&
              skeletonCards.map((_, index) => (
                <div
                  key={`instagram-skeleton-${index}`}
                  className="instagram-card relative min-w-0 shrink-0 overflow-hidden rounded-xl bg-[#dfddd8] animate-pulse"
                  aria-hidden="true"
                />
              ))}

            {!isLoading &&
              posts.map((post) => {
                const imageUrl = post.mediaType === 'VIDEO'
                  ? (post.thumbnailUrl || post.mediaUrl)
                  : post.mediaUrl;
                if (!imageUrl) {
                  if (DEBUG_INSTAGRAM) {
                    console.info('[InstagramSection] Skipped post during render', {
                      id: post.id,
                      mediaType: post.mediaType,
                      reason: 'missing image source (mediaUrl/thumbnailUrl)',
                    });
                  }
                  return null;
                }

                return (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-card group relative min-w-0 shrink-0 overflow-hidden rounded-xl bg-[#dedbd5] shadow-[0_10px_30px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69736f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbf9]"
                    aria-label="Open Instagram post"
                  >
                    <img
                      src={imageUrl}
                      alt={post.caption || 'Instagram post'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                      width={252}
                      height={420}
                    />
                    {post.mediaType === 'VIDEO' && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                          <Play className="h-5 w-5 fill-white" />
                        </span>
                      </div>
                    )}
                  </a>
                );
              })}
              </div>
            </div>
          </div>

          {showFallback && (
            <p className="mt-4 text-center text-sm text-[#65706d]">
              Instagram posts are temporarily unavailable. Please check back shortly.
            </p>
          )}

          <div className="mt-5 text-center sm:mt-6">
            <a
              href="https://www.instagram.com/spirithubcafe/"
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-block text-[15px] text-[#3f4d4c] underline underline-offset-4 transition-colors hover:text-[#2e3b3b]"
            >
              @spirithubcafe
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .instagram-viewport {
          cursor: grab;
        }

        .instagram-viewport:active {
          cursor: grabbing;
        }

        .instagram-strip {
          direction: ltr;
          margin-left: -8px;
        }

        .instagram-card {
          flex: 0 0 clamp(140px, 17.2vw, 208px);
          margin-left: 8px;
          aspect-ratio: 3 / 5;
        }

        .ig-edge {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10;
          display: none;
          height: 100%;
          width: 26px;
        }

        .ig-edge-left {
          left: 0;
          background: linear-gradient(90deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .ig-edge-right {
          right: 0;
          background: linear-gradient(270deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .ig-nav {
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

        .ig-nav:hover:not(:disabled) {
          background: #fffdf9;
          transform: translateY(-50%) scale(1.03);
        }

        .ig-nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .ig-nav-left {
          left: -10px;
        }

        .ig-nav-right {
          right: -10px;
        }

        @media (max-width: 640px) {
          .instagram-card {
            flex-basis: min(40vw, 170px);
          }

          .ig-nav {
            height: 32px;
            width: 32px;
          }

          .ig-nav-left {
            left: 2px;
          }

          .ig-nav-right {
            right: 2px;
          }
        }

        @media (min-width: 768px) {
          .ig-edge {
            display: block;
          }
        }
      `}</style>
    </section>
  );
};
