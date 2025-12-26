/**
 * Simple visitor tracking utility with referrer source tracking
 * For production, consider using Google Analytics, Plausible, or similar analytics service
 */

const STORAGE_KEY = 'storeVisits';
const SESSION_KEY = 'currentSession';
const SOURCES_KEY = 'visitSources';

export interface VisitSource {
  source: string;
  count: number;
  lastVisit: string;
}

/**
 * Detect the source of the visit
 */
function detectVisitSource(): string {
  const referrer = document.referrer.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check URL parameters first (for campaign tracking)
  const utmSource = urlParams.get('utm_source');
  if (utmSource) {
    return utmSource;
  }
  
  // If no referrer, it's a direct visit
  if (!referrer) {
    return 'Direct';
  }
  
  // Social Media Platforms
  if (referrer.includes('facebook.com') || referrer.includes('fb.com')) {
    return 'Facebook';
  }
  if (referrer.includes('instagram.com')) {
    return 'Instagram';
  }
  if (referrer.includes('twitter.com') || referrer.includes('x.com')) {
    return 'Twitter/X';
  }
  if (referrer.includes('linkedin.com')) {
    return 'LinkedIn';
  }
  if (referrer.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (referrer.includes('youtube.com')) {
    return 'YouTube';
  }
  if (referrer.includes('pinterest.com')) {
    return 'Pinterest';
  }
  if (referrer.includes('snapchat.com')) {
    return 'Snapchat';
  }
  if (referrer.includes('whatsapp.com') || referrer.includes('wa.me')) {
    return 'WhatsApp';
  }
  if (referrer.includes('telegram.org') || referrer.includes('t.me')) {
    return 'Telegram';
  }
  
  // Search Engines
  if (referrer.includes('google.com') || referrer.includes('google.')) {
    return 'Google Search';
  }
  if (referrer.includes('bing.com')) {
    return 'Bing Search';
  }
  if (referrer.includes('yahoo.com')) {
    return 'Yahoo Search';
  }
  if (referrer.includes('duckduckgo.com')) {
    return 'DuckDuckGo';
  }
  
  // Other referrers - extract domain
  try {
    const url = new URL(referrer);
    return url.hostname.replace('www.', '');
  } catch {
    return 'Other';
  }
}

/**
 * Initialize visitor tracking
 */
export function initVisitorTracking(): void {
  // Check if this is a new session
  const currentSession = sessionStorage.getItem(SESSION_KEY);
  
  if (!currentSession) {
    // New session - increment visitor count
    const visits = getVisitorCount();
    setVisitorCount(visits + 1);
    
    // Track the source of this visit
    const source = detectVisitSource();
    trackVisitSource(source);
    
    // Mark this session
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
  }
}

/**
 * Track visit source
 */
function trackVisitSource(source: string): void {
  const sources = getVisitSources();
  const existing = sources.find(s => s.source === source);
  
  if (existing) {
    existing.count += 1;
    existing.lastVisit = new Date().toISOString();
  } else {
    sources.push({
      source,
      count: 1,
      lastVisit: new Date().toISOString(),
    });
  }
  
  localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
}

/**
 * Get current visitor count
 */
export function getVisitorCount(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const count = parseInt(stored, 10);
    return isNaN(count) ? 0 : count;
  }
  return 0;
}

/**
 * Set visitor count
 */
export function setVisitorCount(count: number): void {
  localStorage.setItem(STORAGE_KEY, count.toString());
}

/**
 * Get visit sources breakdown
 */
export function getVisitSources(): VisitSource[] {
  const stored = localStorage.getItem(SOURCES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Get social media visits count
 */
export function getSocialMediaVisits(): number {
  const sources = getVisitSources();
  const socialPlatforms = ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 
                           'YouTube', 'Pinterest', 'Snapchat', 'WhatsApp', 'Telegram'];
  
  return sources
    .filter(s => socialPlatforms.includes(s.source))
    .reduce((sum, s) => sum + s.count, 0);
}

/**
 * Reset visitor count (for testing)
 */
export function resetVisitorCount(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOURCES_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
