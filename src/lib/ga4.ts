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
 * Returns true if a <script> tag for the given gtag.js measurement ID
 * already exists in the document. Used to avoid duplicate script injection.
 */
function hasGtagScript(id: string): boolean {
  return !!document.querySelector(
    `script[src*="googletagmanager.com/gtag/js?id=${id}"]`
  );
}

/**
 * Initialise the GA4 data layer.
 *
 * Injects the gtag.js script into <head> (only when VITE_GA4_MEASUREMENT_ID is
 * set and the script is not already present), then pushes the config event.
 * index.html contains only a lightweight dataLayer stub with no network calls,
 * so there is zero performance or network impact when the ID is not configured.
 *
 * Safe to call multiple times – subsequent calls are no-ops.
 */
export function initGA4(): void {
  if (initialised || typeof window === 'undefined') return;

  if (!GA4_ID) {
    console.warn(
      '[GA4] VITE_GA4_MEASUREMENT_ID is not set. ' +
      'Copy .env.example → .env.local (dev) or .env.production (prod), ' +
      'fill in your real Measurement ID (G-XXXXXXXXXX), then rebuild.'
    );
    return;
  }

  // Prevent double-init
  initialised = true;

  // Ensure dataLayer exists (index.html stub should have created it,
  // but guard for SSR / test environments).
  window.dataLayer = window.dataLayer || [];

  // Ensure the gtag function stub exists.
  if (!window.gtag) {
    // Use `arguments` (not a rest array) so the dataLayer entries match
    // the format expected by gtag.js when it loads and replays the queue.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  // Ensure the real gtag.js script is in the DOM, keyed on the correct ID.
  // We check the DOM (not !window.gtag) because index.html always defines the
  // stub, so !window.gtag is never true in a real browser.
  if (!hasGtagScript(GA4_ID)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);
  }

  // gtag('js', new Date()) marks the timestamp for this tag instance.
  // gtag('config', ...) registers the property; send_page_view:false because
  // we fire page views manually on every client-side route change.
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { send_page_view: false });
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
