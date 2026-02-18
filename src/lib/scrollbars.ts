/**
 * scrollbars.ts — OverlayScrollbars helper
 *
 * ⚠️  WARNING: Do NOT call initScrollbars() or apply OverlayScrollbars to any
 * React-managed element.  OverlayScrollbars restructures the DOM by wrapping an
 * element's children inside its own `os-viewport > os-content` nodes.  React's
 * fiber tree keeps stale parent references, so when React later unmounts any of
 * those children it calls `parent.removeChild(child)` on the wrong parent and
 * throws:
 *
 *   NotFoundError: Failed to execute 'removeChild' on 'Node':
 *   The node to be removed is not a child of this node.
 *
 * OverlayScrollbars may only be applied to `document.body` (which uses a safe
 * special-case that does not restructure body's children) — see main.tsx.
 */

export function initScrollbars() {
  // Intentionally disabled — see warning above.
}

export function destroyScrollbars() {
  // No-op — nothing was initialised.
}
