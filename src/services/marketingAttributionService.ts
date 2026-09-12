import { safeStorage } from '../lib/safeStorage';

export interface MarketingAttribution {
  firstTouchAt: string;
  lastTouchAt: string;
  landingPath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
}

const STORAGE_KEY = 'spirithub-marketing-attribution';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const clean = (value: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 250) : undefined;
};

const readStored = (): MarketingAttribution | null => {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketingAttribution;
    const lastTouch = new Date(parsed.lastTouchAt).getTime();
    if (!Number.isFinite(lastTouch) || Date.now() - lastTouch > MAX_AGE_MS) {
      safeStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const inferSource = (referrer?: string): string | undefined => {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('google.')) return 'google';
    if (host.includes('instagram.')) return 'instagram';
    if (host.includes('facebook.') || host.includes('fb.')) return 'facebook';
    if (host.includes('tiktok.')) return 'tiktok';
    return host.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};

const captureFromLocation = (): MarketingAttribution | null => {
  if (typeof window === 'undefined') return readStored();

  const params = new URLSearchParams(window.location.search);
  const now = new Date().toISOString();
  const stored = readStored();
  const referrer = clean(document.referrer);
  const explicitSource = clean(params.get('utm_source'));
  const hasCampaignSignal = Boolean(
    explicitSource ||
    params.get('utm_medium') ||
    params.get('utm_campaign') ||
    params.get('utm_content') ||
    params.get('utm_term') ||
    params.get('gclid') ||
    params.get('fbclid')
  );

  if (!hasCampaignSignal && stored) return stored;

  const attribution: MarketingAttribution = {
    firstTouchAt: stored?.firstTouchAt ?? now,
    lastTouchAt: now,
    landingPath: stored?.landingPath ?? `${window.location.pathname}${window.location.search}`.slice(0, 500),
    referrer: referrer ?? stored?.referrer,
    utmSource: explicitSource ?? stored?.utmSource ?? inferSource(referrer),
    utmMedium: clean(params.get('utm_medium')) ?? stored?.utmMedium,
    utmCampaign: clean(params.get('utm_campaign')) ?? stored?.utmCampaign,
    utmContent: clean(params.get('utm_content')) ?? stored?.utmContent,
    utmTerm: clean(params.get('utm_term')) ?? stored?.utmTerm,
    gclid: clean(params.get('gclid')) ?? stored?.gclid,
    fbclid: clean(params.get('fbclid')) ?? stored?.fbclid,
  };

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
};

let cached = captureFromLocation();

export const marketingAttributionService = {
  refresh: (): MarketingAttribution | null => {
    cached = captureFromLocation();
    return cached;
  },

  get: (): MarketingAttribution | null => cached ?? readStored(),

  enrichMetadata: (metadata?: Record<string, unknown>): Record<string, unknown> => {
    const attribution = marketingAttributionService.get();
    return {
      ...(metadata ?? {}),
      ...(attribution ? {
        marketingAttribution: attribution,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        utmContent: attribution.utmContent,
        utmTerm: attribution.utmTerm,
      } : {}),
    };
  },
};
