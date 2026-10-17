// Pure helpers for the homepage Instagram cards (live data from the official
// Instagram Graph API via api/instagram/feed.js).

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export interface InstagramPost {
  id: string;
  permalink: string;
  mediaType: InstagramMediaType;
  /** Image to show (video: its thumbnail). */
  imageUrl: string;
  /** First sentence/line of the caption, used as the card title. */
  title: string;
  /** The rest of the caption without hashtags, used as the one-line summary. */
  summary: string;
  /** Epoch ms, 0 when unknown. */
  timestamp: number;
}

const MEDIA_TYPES = new Set<string>(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']);
const TITLE_MAX = 90;
const SUMMARY_MAX = 140;

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Cuts at a word boundary and adds an ellipsis. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Splits a caption into a short title (first line, or first sentence when the
 * first line is long) and a summary of what follows. Hashtags are dropped.
 */
export function splitCaption(caption: unknown): { title: string; summary: string } {
  const lines = str(caption)
    .split(/\n+/)
    .map((line) => line.replace(/(^|\s)#[^\s#]+/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (lines.length === 0) return { title: '', summary: '' };

  let [first, ...rest] = lines;
  if (first.length > TITLE_MAX) {
    const sentenceEnd = first.search(/[.!?؟](\s|$)/u);
    if (sentenceEnd > 0 && sentenceEnd < TITLE_MAX) {
      rest = [first.slice(sentenceEnd + 1).trim(), ...rest];
      first = first.slice(0, sentenceEnd + 1);
    }
  }

  return {
    title: truncate(first, TITLE_MAX),
    summary: truncate(rest.join(' ').trim(), SUMMARY_MAX),
  };
}

/**
 * Accepts the normalised feed shape (`mediaType`, `mediaUrl`, …) or raw Graph
 * API items (`media_type`, `media_url`, …). Returns null for unusable items.
 */
export function normalizeInstagramPost(raw: unknown): InstagramPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const mediaType = str(item.mediaType ?? item.media_type);
  const permalink = str(item.permalink);
  const id = str(String(item.id ?? ''));
  if (!MEDIA_TYPES.has(mediaType) || !permalink.startsWith('https://www.instagram.com/') || !id) return null;

  const mediaUrl = str(item.mediaUrl ?? item.media_url);
  const thumbnailUrl = str(item.thumbnailUrl ?? item.thumbnail_url);
  // Videos must use the still thumbnail; their media URL is the .mp4.
  const imageUrl = mediaType === 'VIDEO' ? thumbnailUrl : mediaUrl || thumbnailUrl;
  if (!imageUrl.startsWith('https://')) return null;

  const parsed = Date.parse(str(item.timestamp));
  return {
    id,
    permalink,
    mediaType: mediaType as InstagramMediaType,
    imageUrl,
    ...splitCaption(item.caption),
    timestamp: Number.isNaN(parsed) ? 0 : parsed,
  };
}

/** Pinned permalinks first (in the configured order), then newest first; de-duplicated. */
export function selectInstagramPosts(
  items: unknown,
  { limit = 6, pinnedPermalinks = [] }: { limit?: number; pinnedPermalinks?: string[] } = {},
): InstagramPost[] {
  const seen = new Set<string>();
  const posts = (Array.isArray(items) ? items : [])
    .map(normalizeInstagramPost)
    .filter((post): post is InstagramPost => {
      if (!post || seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });

  const pinRank = (post: InstagramPost) => {
    const index = pinnedPermalinks.indexOf(post.permalink);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };

  return posts.sort((a, b) => pinRank(a) - pinRank(b) || b.timestamp - a.timestamp).slice(0, limit);
}

/** Parses a comma-separated permalink list (e.g. from an env var). */
export function parsePinnedPermalinks(value: unknown): string[] {
  return str(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
