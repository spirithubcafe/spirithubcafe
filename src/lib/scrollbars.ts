/**
 * scrollbars.ts - OverlayScrollbars page (body) integration.
 *
 * OverlayScrollbars officially supports the `body` element: initializing on
 * `document.body` turns the native page scrollbar into the custom themed
 * overlay scrollbar while preserving native scroll behaviour (window.scrollTo,
 * document.scrollingElement, keyboard, wheel, touch all keep working).
 *
 * For React-managed elements use the <OverlayScroll> component instead -
 * never call the imperative API on an arbitrary React element.
 */
import { OverlayScrollbars, ClickScrollPlugin } from 'overlayscrollbars';

type OverlayScrollbarsInstance = ReturnType<typeof OverlayScrollbars>;

let pluginRegistered = false;
let bodyInstance: OverlayScrollbarsInstance | null = null;

/**
 * Apply OverlayScrollbars to <body> so every page uses the custom themed
 * overlay scrollbar instead of the native one. Safe to call multiple times.
 */
export function initBodyScrollbars(): OverlayScrollbarsInstance | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!pluginRegistered) {
    OverlayScrollbars.plugin(ClickScrollPlugin);
    pluginRegistered = true;
  }

  if (bodyInstance && !bodyInstance.state().destroyed) {
    return bodyInstance;
  }

  bodyInstance = OverlayScrollbars(
    {
      target: document.body,
      cancel: {
        // Keep our overlay scrollbars even when the platform already paints
        // overlaid native scrollbars (touch / macOS), for a consistent look.
        nativeScrollbarsOverlaid: false,
        // Never cancel the dedicated body initialisation.
        body: false,
      },
    },
    {
      scrollbars: {
        theme: 'os-theme-custom',
        autoHide: 'never',
        clickScroll: true,
      },
    },
  );

  return bodyInstance;
}

export function destroyScrollbars(): void {
  if (bodyInstance && !bodyInstance.state().destroyed) {
    bodyInstance.destroy();
  }
  bodyInstance = null;
}
