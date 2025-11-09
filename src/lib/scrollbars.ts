// Global Overlayscrollbars auto-initialization utility
// Applies custom scrollbars to dialogs, sheets, drawers, scroll areas and any element
// with overflow utility classes. Uses a MutationObserver for dynamic content.
import { OverlayScrollbars } from 'overlayscrollbars'

type OsInstance = ReturnType<typeof OverlayScrollbars> | null

const SELECTORS = [
  '[data-slot="dialog-content"]',
  '[data-slot="alert-dialog-content"]',
  '[data-slot="sheet-content"]',
  '[data-slot="drawer-content"]',
  '.overflow-y-auto',
  '.overflow-auto',
  '.overflow-x-auto'
].join(',')

const applied = new Map<Element, OsInstance>()

function applyTo(el: Element) {
  if (applied.has(el)) return
  // Skip if element already has an overlayscrollbars instance attribute
  // (some components might initialize themselves later)
  // Skip if element is 'fixed' positioned (likely a modal/dialog root)
  const style = window.getComputedStyle(el)
  if (style.position === 'fixed') return
  try {
    const instance = OverlayScrollbars(el as HTMLElement, {
      className: 'os-theme-custom',
      scrollbars: {
        autoHide: 'leave',
        clickScroll: true,
        dragScroll: true
      }
    } as any)
    applied.set(el, instance)
  } catch {
    // Fail silently – element might not be a suitable container yet.
  }
}

function scan(root: ParentNode = document) {
  root.querySelectorAll(SELECTORS).forEach(applyTo)
}

let observer: MutationObserver | null = null

export function initScrollbars() {
  if (typeof window === 'undefined') return
  scan()
  if (!observer) {
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.matches(SELECTORS)) applyTo(node)
              // Also scan inside the added subtree for matches
              scan(node)
            }
          })
        }
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
  }
}

export function destroyScrollbars() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  applied.forEach((inst) => {
    try { inst?.destroy() } catch { /* noop */ }
  })
  applied.clear()
}