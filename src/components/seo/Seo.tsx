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

const ensureMeta = (selector: string, attributes: Record<string, string>, content: string) => {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const ensureLink = (rel: string, href: string) => {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

const removeMeta = (selector: string) => {
  if (typeof document === 'undefined') return;
  const element = document.head.querySelector(selector);
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
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

    const base = siteMetadata.baseUrl || window.location.origin;
    return `${base}${location.pathname}${location.search}`;
  }, [canonical, location.pathname, location.search]);

  const resolvedLocale = locale ?? (language === 'ar' ? 'ar-OM' : 'en-OM');
  const keywordsContent = Array.isArray(keywords)
    ? keywords.join(', ')
    : keywords ?? siteMetadata.defaultKeywords.join(', ');
  const resolvedDescription =
    description ??
    (language === 'ar' ? siteMetadata.defaultDescriptionAr : siteMetadata.defaultDescription);
  const resolvedTitle = title ? `${title} | ${siteMetadata.siteName}` : siteMetadata.defaultTitle;
  const resolvedImage = resolveAbsoluteUrl(image) ?? resolveAbsoluteUrl(siteMetadata.defaultImage);
  const structuredPayload = structuredData ? JSON.stringify(structuredData) : null;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = resolvedTitle;
    ensureMeta('meta[name="description"]', { name: 'description' }, resolvedDescription);
    ensureMeta('meta[name="keywords"]', { name: 'keywords' }, keywordsContent);
    
    const finalOgDesc = ogDescription || resolvedDescription;
    ensureMeta('meta[property="og:title"]', { property: 'og:title' }, resolvedTitle);
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }, finalOgDesc);
    ensureMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }, resolvedCanonical);
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, siteMetadata.siteName);
    ensureMeta('meta[property="og:image"]', { property: 'og:image' }, resolvedImage ?? '');
    ensureMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
    ensureMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
    ensureMeta('meta[property="og:locale"]', { property: 'og:locale' }, resolvedLocale);
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, resolvedTitle);
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, finalOgDesc);
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, resolvedImage ?? '');
    ensureMeta('meta[name="twitter:site"]', { name: 'twitter:site' }, siteMetadata.twitterHandle);

    if (noindex) {
      ensureMeta('meta[name="robots"]', { name: 'robots' }, robots ?? 'noindex,nofollow');
    } else if (robots) {
      ensureMeta('meta[name="robots"]', { name: 'robots' }, robots);
    } else {
      removeMeta('meta[name="robots"]');
    }

    ensureLink('canonical', resolvedCanonical);
  }, [
    keywordsContent,
    noindex,
    ogDescription,
    resolvedCanonical,
    resolvedDescription,
    resolvedImage,
    resolvedLocale,
    resolvedTitle,
    robots,
    type,
  ]);

  useEffect(() => {
    if (typeof document === 'undefined' || !structuredPayload) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-generated', 'seo');
    script.text = structuredPayload;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [structuredPayload]);

  return null;
};
