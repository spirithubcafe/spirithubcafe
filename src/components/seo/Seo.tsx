import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { resolveAbsoluteUrl, siteMetadata } from '../../config/siteMetadata';

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  canonical?: string;
  image?: string;
  ogDescription?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  robots?: string;
  structuredData?: StructuredData;
  locale?: string;
}

const REGION_HOSTS = {
  om: 'https://spirithubcafe.com',
  sa: 'https://spirithub.sa',
} as const;

type RegionCode = keyof typeof REGION_HOSTS;

const detectRegionFromPath = (pathname: string): RegionCode => {
  if (pathname === '/sa' || pathname.startsWith('/sa/')) return 'sa';
  return 'om';
};

const stripRegionPrefix = (pathname: string): string => {
  if (pathname === '/om' || pathname === '/sa') return '/';
  if (pathname.startsWith('/om/')) return pathname.slice(3) || '/';
  if (pathname.startsWith('/sa/')) return pathname.slice(3) || '/';
  return pathname || '/';
};

const ensureLeadingSlash = (pathname: string): string => (pathname.startsWith('/') ? pathname : `/${pathname}`);

const buildRegionalUrl = (region: RegionCode, normalizedPath: string): string => {
  const host = REGION_HOSTS[region];
  if (region === 'om') {
    return normalizedPath === '/' ? `${host}/om` : `${host}/om${normalizedPath}`;
  }
  return normalizedPath === '/' ? host : `${host}${normalizedPath}`;
};

const isSameHost = (value: string, expected: string): boolean => {
  try {
    return new URL(value).host === new URL(expected).host;
  } catch {
    return false;
  }
};

const normalizeCanonicalForRegion = (
  canonicalUrl: string,
  pathname: string,
  region: RegionCode
): string => {
  try {
    const parsed = new URL(canonicalUrl);
    const hasRegionPrefix = parsed.pathname === '/om' || parsed.pathname === '/sa' || parsed.pathname.startsWith('/om/') || parsed.pathname.startsWith('/sa/');
    const isOmanHost = isSameHost(canonicalUrl, REGION_HOSTS.om);
    const isSaudiHost = isSameHost(canonicalUrl, REGION_HOSTS.sa);

    if (hasRegionPrefix || isSaudiHost) {
      return canonicalUrl;
    }

    if (isOmanHost && (pathname === '/om' || pathname === '/sa' || pathname.startsWith('/om/') || pathname.startsWith('/sa/'))) {
      const normalizedPath = stripRegionPrefix(pathname);
      return buildRegionalUrl(region, ensureLeadingSlash(normalizedPath));
    }

    return canonicalUrl;
  } catch {
    return canonicalUrl;
  }
};

const ensureMeta = (selector: string, attributes: Record<string, string>, content: string) => {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  // Always update content, even if it's the same (ensures freshness)
  element.setAttribute('content', content);
  
  // For Open Graph tags, also set data-react-helmet attribute to prevent conflicts
  if (attributes.property && attributes.property.startsWith('og:')) {
    element.setAttribute('data-react-helmet', 'true');
  }
};

const ensureLink = (rel: string, href: string, hreflang?: string) => {
  if (typeof document === 'undefined') return;
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    if (hreflang) element.hreflang = hreflang;
    document.head.appendChild(element);
  }
  element.href = href;
};

const removeMeta = (selector: string) => {
  if (typeof document === 'undefined') return;
  try {
    const element = document.head.querySelector(selector);
    if (element && element.isConnected && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  } catch {
    // Element may have already been removed by a concurrent update or
    // a browser extension — safe to ignore.
  }
};

export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  keywords,
  canonical,
  image,
  ogDescription,
  type = 'website',
  noindex = false,
  robots,
  structuredData,
  locale,
}) => {
  const { language } = useApp();
  const location = useLocation();

  const resolvedCanonical = useMemo(() => {
    if (canonical) {
      return canonical;
    }
    // Use siteMetadata.baseUrl (never window.location.origin) so SSR stays consistent
    const base = siteMetadata.baseUrl;
    // Strip query params from canonical (product listing pages with ?category= are handled separately)
    const cleanPath = location.pathname;
    return `${base}${cleanPath}`;
  }, [canonical, location.pathname]);

  const resolvedLocale = locale ?? (language === 'ar' ? 'ar-OM' : 'en-OM');
  const region = detectRegionFromPath(location.pathname);
  const normalizedPath = ensureLeadingSlash(stripRegionPrefix(location.pathname));
  const canonicalForRegion = normalizeCanonicalForRegion(resolvedCanonical, location.pathname, region);
  const omUrl = buildRegionalUrl('om', normalizedPath);
  const saUrl = buildRegionalUrl('sa', normalizedPath);
  const keywordsContent = Array.isArray(keywords)
    ? keywords.join(', ')
    : keywords ?? siteMetadata.defaultKeywords.join(', ');
  const resolvedDescription =
    description ??
    (language === 'ar' ? siteMetadata.defaultDescriptionAr : siteMetadata.defaultDescription);
  const resolvedTitle = title ? `${title} | ${siteMetadata.siteName}` : siteMetadata.defaultTitle;
  
  // Ensure images are always absolute URLs for social media crawlers
  const resolvedImage = (() => {
    const imgUrl = resolveAbsoluteUrl(image) ?? resolveAbsoluteUrl(siteMetadata.defaultImage);
    // Double-check it's an absolute URL
    if (imgUrl && !imgUrl.startsWith('http')) {
      return `${siteMetadata.baseUrl}${imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl}`;
    }
    return imgUrl;
  })();
  
  const structuredPayload = structuredData 
    ? JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData]) 
    : null;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = resolvedTitle;
    document.documentElement.lang = resolvedLocale.split('-')[0]; // Set html lang attribute
    
    ensureMeta('meta[name="description"]', { name: 'description' }, resolvedDescription);
    ensureMeta('meta[name="keywords"]', { name: 'keywords' }, keywordsContent);
    
    const finalOgDesc = ogDescription || resolvedDescription;
    ensureMeta('meta[property="og:title"]', { property: 'og:title' }, resolvedTitle);
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }, finalOgDesc);
    ensureMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalForRegion);
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, siteMetadata.siteName);
    
    // Ensure Open Graph image is set, with fallback
    if (resolvedImage) {
      // WhatsApp doesn't support WebP — proxy via wsrv.nl for JPEG conversion
      const isWebp = resolvedImage.toLowerCase().endsWith('.webp');
      const socialImage = isWebp
        ? `https://wsrv.nl/?url=${encodeURIComponent(resolvedImage)}&output=jpg&q=90&w=1200&h=630&fit=cover`
        : resolvedImage;
      ensureMeta('meta[property="og:image"]', { property: 'og:image' }, socialImage);
      ensureMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, socialImage);
      ensureMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
      ensureMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
      ensureMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, resolvedTitle);
      ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, socialImage);
      ensureMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, resolvedTitle);
    }

    // Locale: reflect actual region + language, not always en-OM
    const ogLocaleCode = resolvedLocale.replace('-', '_');
    const ogLocaleAlt = region === 'sa'
      ? (resolvedLocale.startsWith('ar') ? 'en_SA' : 'ar_SA')
      : (resolvedLocale.startsWith('ar') ? 'en_OM' : 'ar_OM');
    ensureMeta('meta[property="og:locale"]', { property: 'og:locale' }, ogLocaleCode);
    ensureMeta('meta[property="og:locale:alternate"]', { property: 'og:locale:alternate' }, ogLocaleAlt);
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, resolvedTitle);
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, finalOgDesc);
    ensureMeta('meta[name="twitter:site"]', { name: 'twitter:site' }, siteMetadata.twitterHandle);
    ensureMeta('meta[name="twitter:creator"]', { name: 'twitter:creator' }, siteMetadata.twitterHandle);

    if (noindex) {
      ensureMeta('meta[name="robots"]', { name: 'robots' }, robots ?? 'noindex,nofollow');
    } else if (robots) {
      ensureMeta('meta[name="robots"]', { name: 'robots' }, robots);
    } else {
      removeMeta('meta[name="robots"]');
    }

    ensureLink('canonical', canonicalForRegion);
    
    // Language/market alternates
    ensureLink('alternate', omUrl, 'en-OM');
    ensureLink('alternate', omUrl, 'ar-OM');
    ensureLink('alternate', saUrl, 'en-SA');
    ensureLink('alternate', saUrl, 'ar-SA');
    ensureLink('alternate', omUrl, 'x-default');
  }, [
    canonicalForRegion,
    keywordsContent,
    noindex,
    ogDescription,
    resolvedDescription,
    resolvedImage,
    resolvedLocale,
    resolvedTitle,
    robots,
    omUrl,
    saUrl,
    type,
  ]);

  useEffect(() => {
    if (typeof document === 'undefined' || !structuredPayload) {
      return;
    }

    // Remove all existing SEO-generated scripts
    const existingScripts = document.head.querySelectorAll('script[data-generated="seo"]');
    existingScripts.forEach(s => s.remove());

    // Add new script with structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-generated', 'seo');
    script.text = structuredPayload;
    document.head.appendChild(script);

    return () => {
      try {
        if (script.isConnected && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch {
        // Already detached — ignore.
      }
    };
  }, [structuredPayload]);

  return null;
};
