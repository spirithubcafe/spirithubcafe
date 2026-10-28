/** Pixels the page must scroll in one direction before the bar changes state. */
export const SCROLL_MINIMIZE_THRESHOLD = 6;

export interface ScrollMinimizeState {
  minimized: boolean;
  /** Furthest scroll position reached in the current direction. */
  anchorY: number;
}

export const initialScrollMinimizeState: ScrollMinimizeState = { minimized: false, anchorY: 0 };

/**
 * Decides whether the mobile bottom bar is minimized after a scroll to `y`.
 * Scrolling down by the threshold minimizes it; scrolling back up by the
 * threshold or reaching the top restores it. `maxY` clamps iOS overscroll so
 * the rubber-band bounce at the page end does not count as scrolling up.
 */
export const nextScrollMinimizeState = (
  state: ScrollMinimizeState,
  y: number,
  maxY: number = Number.POSITIVE_INFINITY,
  threshold: number = SCROLL_MINIMIZE_THRESHOLD,
): ScrollMinimizeState => {
  const scrollY = Math.min(Math.max(y, 0), Math.max(maxY, 0));

  if (scrollY <= 0) {
    return state.minimized || state.anchorY !== 0 ? initialScrollMinimizeState : state;
  }

  if (state.minimized) {
    if (scrollY > state.anchorY) return { minimized: true, anchorY: scrollY };
    if (state.anchorY - scrollY >= threshold) return { minimized: false, anchorY: scrollY };
    return state;
  }

  if (scrollY < state.anchorY) return { minimized: false, anchorY: scrollY };
  if (scrollY - state.anchorY >= threshold) return { minimized: true, anchorY: scrollY };
  return state;
};

/**
 * Whether `pathname` belongs to the nav destination `path`. A region root
 * (`/om`) matches only itself; other paths match themselves and their
 * sub-pages on a segment boundary (`/om/products` matches `/om/products/x`,
 * not `/om/products-old`).
 */
export const isNavPathActive = (pathname: string, path: string): boolean => {
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const target = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (/^\/[a-z]{2}$/.test(target)) return current === target;
  return current === target || current.startsWith(`${target}/`);
};
