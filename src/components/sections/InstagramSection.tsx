import React, { useEffect, useState } from 'react';
import { Images, Instagram, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { REGION_INFO } from '../../config/regionInfo';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import {
  parsePinnedPermalinks,
  selectInstagramPosts,
  type InstagramMediaType,
  type InstagramPost,
} from '../../lib/instagramFeed.ts';
import { ProductCardSkeleton } from './ProductGridSkeleton';
import { HOMEPAGE_CONTAINER, homepageSectionClassName } from './homepageSectionSpacing';
import { HomeSectionHeader } from './HomeSectionHeader';

const POST_COUNT = 6;
// Latest posts, live, from the official Instagram Graph API (api/instagram/feed.js).
const LIVE_FEED_URL = '/api/instagram/feed?postLimit=25';
const FALLBACK_PROFILE = 'https://www.instagram.com/spirithubcafe/';

type FeedState = { status: 'loading' | 'ready' | 'failed'; posts: InstagramPost[] };

function useInstagramPosts(): FeedState {
  const [state, setState] = useState<FeedState>({ status: 'loading', posts: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetch(LIVE_FEED_URL, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: { posts?: unknown } } | null) => {
        const posts = selectInstagramPosts(payload?.data?.posts, {
          limit: POST_COUNT,
          pinnedPermalinks: parsePinnedPermalinks(import.meta.env.VITE_INSTAGRAM_PINNED_PERMALINKS),
        });
        setState(posts.length > 0 ? { status: 'ready', posts } : { status: 'failed', posts: [] });
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setState({ status: 'failed', posts: [] });
      });
    return () => controller.abort();
  }, []);

  return state;
}

const MEDIA_LABELS: Record<InstagramMediaType, { en: string; ar: string }> = {
  IMAGE: { en: 'Post', ar: 'منشور' },
  VIDEO: { en: 'Reel', ar: 'ريلز' },
  CAROUSEL_ALBUM: { en: 'Album', ar: 'ألبوم' },
};

/**
 * Instagram post in the same card as the homepage ProductCard (same frame,
 * rows and heights), so the grid reads as one family with the product grids
 * and ProductCardSkeleton (without the notes row) matches it exactly while loading.
 */
const InstagramPostCard: React.FC<{ post: InstagramPost; handle: string; isArabic: boolean }> = ({
  post,
  handle,
  isArabic,
}) => {
  const typeLabel = MEDIA_LABELS[post.mediaType][isArabic ? 'ar' : 'en'];
  const date = post.timestamp
    ? new Intl.DateTimeFormat(isArabic ? 'ar' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(post.timestamp)
    : '';
  const title = post.title || (isArabic ? 'منشور على إنستغرام' : 'Instagram post');
  const openLabel = isArabic ? 'شاهد على إنستغرام' : 'View on Instagram';

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border border-stone-100 bg-white py-0 shadow-sm transition-all duration-300 hover:shadow-md">
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-square overflow-hidden bg-[#fbf8f3]"
      >
        <img
          src={post.imageUrl}
          alt=""
          width={480}
          height={480}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span className="absolute end-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-sm">
          <Instagram className="size-4" />
        </span>
        {post.mediaType !== 'IMAGE' && (
          <span className="absolute bottom-2 start-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {post.mediaType === 'VIDEO' ? <Play className="size-3 fill-white" /> : <Images className="size-3" />}
            {typeLabel}
          </span>
        )}
      </a>

      <CardContent className="flex flex-1 flex-col p-3 pt-1">
        <div className="mb-1 flex min-h-6 items-center">
          <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {date ? `${typeLabel} · ${date}` : typeLabel}
          </span>
        </div>
        <h3 className="mb-2 line-clamp-2 min-h-10 text-sm font-extrabold text-stone-900 transition-colors group-hover:text-amber-700" dir="auto">
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus-visible:outline-2! focus-visible:-outline-offset-2 focus-visible:outline-amber-600!"
          >
            {title}
          </a>
        </h3>
        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-2">
          <span className="text-sm font-bold leading-6 text-stone-900" dir="ltr">{handle}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          asChild
          size="sm"
          className="w-full bg-amber-600 text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg"
        >
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label={`${openLabel}: ${title}`}>
            <Instagram className="size-3.5" aria-hidden="true" />
            <span className="text-xs font-semibold">{openLabel}</span>
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const InstagramSection: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';
  const feed = useInstagramPosts();

  const profileUrl = REGION_INFO[currentRegion.code]?.social.instagram || FALLBACK_PROFILE;
  const handle = `@${profileUrl.split('/').filter(Boolean).pop()}`;

  return (
    <section className={homepageSectionClassName('bg-white')} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={HOMEPAGE_CONTAINER}>
        <HomeSectionHeader
          eyebrow={isArabic ? 'تابعونا' : 'Follow Along'}
          title={isArabic ? 'زوروا إنستغرامنا' : 'Visit Our Instagram'}
          action={{ label: `${isArabic ? 'تابعنا' : 'Follow'} ${handle}`, to: profileUrl, external: true }}
        />

        {/* Same grid as the product sections. While loading, ProductCardSkeleton reserves the
            exact card size, so nothing moves when posts arrive. If the feed is unavailable,
            only the header and the Follow link remain. */}
        {feed.status !== 'failed' && (
          <div
            className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6"
            aria-busy={feed.status === 'loading'}
          >
            {feed.status === 'loading'
              ? Array.from({ length: POST_COUNT }).map((_, index) => <ProductCardSkeleton key={index} showNotes={false} />)
              : feed.posts.map((post) => (
                  <InstagramPostCard key={post.id} post={post} handle={handle} isArabic={isArabic} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
};
