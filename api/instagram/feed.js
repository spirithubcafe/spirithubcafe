/**
 * Vercel serverless function – Instagram Graph API feed proxy
 *
 * Required environment variable:
 *   INSTAGRAM_ACCESS_TOKEN  – Long-lived Instagram Graph API access token
 *
 * Optional environment variable:
 *   INSTAGRAM_USER_ID  – Instagram business/creator account ID (defaults to "me")
 *
 * Returns JSON in the shape expected by InstagramSection.tsx:
 *   { success: true, data: { posts: [...], fromCacheFallback: false } }
 */

const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v22.0';
const MEDIA_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';

// In-memory cache (shared within the same serverless container lifetime)
let cachedPosts = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function mapMediaType(mt) {
  if (mt === 'IMAGE' || mt === 'VIDEO' || mt === 'CAROUSEL_ALBUM') return mt;
  return null;
}

function normalizePost(item) {
  const mediaType = mapMediaType(item.media_type);
  const permalink = typeof item.permalink === 'string' ? item.permalink : '';
  if (!mediaType || !permalink) return null;
  return {
    id: String(item.id),
    mediaType,
    mediaUrl: typeof item.media_url === 'string' ? item.media_url : undefined,
    thumbnailUrl: typeof item.thumbnail_url === 'string' ? item.thumbnail_url : undefined,
    permalink,
    caption: typeof item.caption === 'string' ? item.caption : undefined,
    timestamp: typeof item.timestamp === 'string' ? item.timestamp : undefined,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Accept-Encoding');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID || 'me';

  if (!accessToken) {
    console.error('[Instagram] INSTAGRAM_ACCESS_TOKEN is not configured');
    return res.status(503).json({ success: false, message: 'Instagram feed not configured' });
  }

  // Serve from cache if still valid
  if (cachedPosts && Date.now() - cacheTimestamp < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res.status(200).json({ success: true, data: { posts: cachedPosts, fromCacheFallback: false } });
  }

  const postLimit = Math.min(parseInt(String(req.query?.postLimit ?? '25'), 10) || 25, 50);

  const apiUrl = new URL(`${INSTAGRAM_API_BASE}/${encodeURIComponent(userId)}/media`);
  apiUrl.searchParams.set('fields', MEDIA_FIELDS);
  apiUrl.searchParams.set('limit', String(postLimit));
  apiUrl.searchParams.set('access_token', accessToken);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    let igResponse;
    try {
      igResponse = await fetch(apiUrl.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!igResponse.ok) {
      const body = await igResponse.text().catch(() => '');
      console.error(`[Instagram] Graph API responded ${igResponse.status}:`, body.slice(0, 300));
      return res.status(502).json({ success: false, message: `Instagram API error: ${igResponse.status}` });
    }

    const json = await igResponse.json();

    if (json.error) {
      console.error('[Instagram] Graph API error object:', json.error);
      return res.status(502).json({
        success: false,
        message: typeof json.error.message === 'string' ? json.error.message : 'Instagram API error',
      });
    }

    const items = Array.isArray(json.data) ? json.data : [];
    const posts = items.map(normalizePost).filter(Boolean);

    // Update cache
    cachedPosts = posts;
    cacheTimestamp = Date.now();

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res.status(200).json({ success: true, data: { posts, fromCacheFallback: false } });
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('[Instagram] Graph API request timed out');
      return res.status(504).json({ success: false, message: 'Instagram API request timed out' });
    }
    console.error('[Instagram] Unexpected error:', err?.message ?? err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
