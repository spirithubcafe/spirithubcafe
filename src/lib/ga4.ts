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
 * Inject the gtag.js script tag and initialise the GA4 data layer.
 * Safe to call multiple times – subsequent calls are no-ops.
 */
export function initGA4(): void {
  if (initialised || !GA4_ID || typeof window === 'undefined') return;

  // Prevent double-init
  initialised = true;

  // Initialise the data layer before the script loads so events
  // queued via gtag() are processed once the library is ready.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, {
    send_page_view: false, // We send page views manually on route change
  });

  // Load gtag.js asynchronously – no impact on page load speed
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  script.async = true;
  document.head.appendChild(script);
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
