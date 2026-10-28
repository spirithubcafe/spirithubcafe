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
let stopEdgeReveal: (() => void) | null = null;

const AUTO_HIDE_DELAY_MS = 900;
const EDGE_REVEAL_PX = 24;
const EDGE_REVEAL_CLASS = 'os-edge-reveal';

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
        // Visible while the page scrolls, then fades out.
        autoHide: 'scroll',
        autoHideDelay: AUTO_HIDE_DELAY_MS,
        clickScroll: true,
      },
    },
  );

  stopEdgeReveal ??= startEdgeReveal();

  return bodyInstance;
}

/**
 * A hidden bar can't be hovered, so a mouse user could never grab it. Show
 * the page bar while the mouse is within EDGE_REVEAL_PX of it (and a little
 * after it leaves). Touch and pen are ignored; they scroll by swiping.
 */
function startEdgeReveal(): () => void {
  const root = document.documentElement;
  let frame = 0;
  let hideTimer = 0;
  let lastX = 0;
  let lastY = 0;

  const update = () => {
    frame = 0;
    const bar = document.querySelector<HTMLElement>('body > .os-scrollbar-vertical');
    const rect = bar?.getBoundingClientRect();
    const near =
      !!rect &&
      rect.width > 0 &&
      lastY >= rect.top &&
      lastY <= rect.bottom &&
      lastX >= rect.left - EDGE_REVEAL_PX &&
      lastX <= rect.right + EDGE_REVEAL_PX;

    if (near) {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      root.classList.add(EDGE_REVEAL_CLASS);
    } else if (root.classList.contains(EDGE_REVEAL_CLASS) && !hideTimer) {
      hideTimer = window.setTimeout(() => {
        hideTimer = 0;
        root.classList.remove(EDGE_REVEAL_CLASS);
      }, AUTO_HIDE_DELAY_MS);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    lastX = event.clientX;
    lastY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    if (frame) window.cancelAnimationFrame(frame);
    window.clearTimeout(hideTimer);
    root.classList.remove(EDGE_REVEAL_CLASS);
  };
}

export function destroyScrollbars(): void {
  if (bodyInstance && !bodyInstance.state().destroyed) {
    bodyInstance.destroy();
  }
  bodyInstance = null;
  stopEdgeReveal?.();
  stopEdgeReveal = null;
}
