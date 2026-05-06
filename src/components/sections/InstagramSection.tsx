import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

type InstagramPost = {
  id: string;
  mediaType: InstagramMediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
};

type FeedResponse = {
  success?: boolean;
  data?: {
    posts?: InstagramPost[];
    fromCacheFallback?: boolean;
  };
  message?: string;
};

const MAX_POSTS = 10;

const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE_URL_OM ||
  import.meta.env.VITE_API_BASE_URL_SA ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://api.spirithubcafe.com';

const isValidMediaType = (value: unknown): value is InstagramMediaType =>
  value === 'IMAGE' || value === 'VIDEO' || value === 'CAROUSEL_ALBUM';

const normalizePosts = (payload: unknown): InstagramPost[] => {
  const items: unknown[] = Array.isArray(payload) ? payload : [];

  return items
    .map((raw) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }
      const item = raw as Record<string, unknown>;
      const mediaType = item.mediaType;
      const permalink = typeof item.permalink === 'string' ? item.permalink : '';

      if (!isValidMediaType(mediaType) || !permalink) {
        return null;
      }

      return {
        id: String(item.id ?? permalink),
        mediaType,
        mediaUrl: typeof item.mediaUrl === 'string' ? item.mediaUrl : undefined,
        thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl : undefined,
        permalink,
        caption: typeof item.caption === 'string' ? item.caption : undefined,
      } as InstagramPost;
    })
    .filter((post): post is InstagramPost => post !== null)
    .slice(0, MAX_POSTS);
};

export const InstagramSection: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const stripRef = React.useRef<HTMLDivElement | null>(null);

  const updateScrollState = React.useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanScrollPrev(left > 2);
    setCanScrollNext(left < max - 2);
  }, []);

  const scrollByPage = (direction: 'prev' | 'next') => {
    const el = stripRef.current;
    if (!el) return;

    const delta = Math.max(220, Math.round(el.clientWidth * 0.75));

    el.scrollBy({
      left: direction === 'next' ? delta : -delta,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadFeed = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/instagram/feed`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Feed request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as FeedResponse;
        const parsedPosts = normalizePosts(payload?.data?.posts);
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
    updateScrollState();
    const el = stripRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [posts, isLoading, updateScrollState]);

  const showFallback = hasError || (!isLoading && posts.length === 0);

  const skeletonCards = useMemo(() => Array.from({ length: 7 }), []);
  const isArabic =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' || document.documentElement.lang?.toLowerCase().startsWith('ar'));

  return (
    <section className="bg-[#fbfbf9] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-2xl font-semibold tracking-[1px] text-[#2E2E2E] md:text-3xl">
            {isArabic ? 'زوروا إنستغرامنا' : 'VISIT OUR INSTAGRAM'}
          </h2>
          <div className="mx-auto mt-4 h-px w-12 bg-[#b9b8b2]" />
        </div>

        <div className="mx-auto w-full max-w-[1320px]">
          <div className="relative">
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

            <div
              ref={stripRef}
              className="instagram-strip flex gap-1.5 overflow-x-auto pb-2 sm:gap-2 md:gap-2.5"
            >
            {isLoading &&
              skeletonCards.map((_, index) => (
                <div
                  key={`instagram-skeleton-${index}`}
                  className="instagram-card relative shrink-0 overflow-hidden rounded-md bg-[#dfddd8] animate-pulse"
                  aria-hidden="true"
                />
              ))}

            {!isLoading &&
              posts.map((post) => {
                const imageUrl = post.mediaType === 'VIDEO' ? post.thumbnailUrl : post.mediaUrl;
                if (!imageUrl) {
                  return null;
                }

                return (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-card group relative shrink-0 overflow-hidden rounded-md bg-[#dedbd5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69736f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbf9]"
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
        .instagram-strip {
          direction: ltr;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
        }

        .instagram-strip::-webkit-scrollbar {
          display: none;
        }

        .instagram-card {
          width: clamp(140px, 17.2vw, 208px);
          aspect-ratio: 3 / 5;
          scroll-snap-align: start;
        }

        .ig-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          height: 36px;
          width: 36px;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: #4b5a58;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
        }

        .ig-nav:hover:not(:disabled) {
          background: #ffffff;
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
            width: min(40vw, 170px);
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
      `}</style>
    </section>
  );
};
