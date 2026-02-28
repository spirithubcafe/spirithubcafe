/**
 * Google Analytics 4 (GA4) integration utility.
 *
 * Loads the gtag.js script asynchronously and provides helpers for
 * tracking page views and custom events.
 *
 * Configure by setting the environment variable:
 *   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
 *
 * The script will NOT load if the measurement ID is missing, so there
 * is zero impact on performance or behaviour when GA4 is not configured.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA4_ID: string | undefined =
  typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_GA4_MEASUREMENT_ID as string | undefined)
    : undefined;

let initialised = false;

/**
 * Initialise the GA4 data layer.
 *
 * The gtag.js script is loaded directly from index.html so that
 * Google's tag-coverage checker can detect it in the initial HTML.
 * This function only ensures the data-layer plumbing is ready for
 * SPA page-view / event tracking – it will NOT inject a duplicate
 * script tag.
 *
 * Safe to call multiple times – subsequent calls are no-ops.
 */
export function initGA4(): void {
  if (initialised || !GA4_ID || typeof window === 'undefined') return;

  // Prevent double-init
  initialised = true;

  // If the gtag snippet was already placed in the HTML <head>,
  // dataLayer and gtag() will already exist. Only set them up when
  // they are missing (e.g. during unit tests or local dev without
  // the env var baked into index.html).
  if (!window.dataLayer) {
    window.dataLayer = window.dataLayer || [];
    // Use `arguments` (not a rest array) so the dataLayer entries match
    // the format expected by gtag.js when it loads and replays the queue.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      send_page_view: false, // We send page views manually on route change
    });

    // Fallback: inject the script dynamically when it was NOT in the HTML
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    script.async = true;
    document.head.appendChild(script);
  }
}

/**
 * Track a page view. Call this on every client-side route change.
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA4_ID || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.origin + path,
  });
}

/**
 * Track a custom event (e.g. add_to_cart, purchase, sign_up).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, any>,
): void {
  if (!GA4_ID || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, params);
}
