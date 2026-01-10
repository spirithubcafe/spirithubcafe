import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Import fonts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';

import './index.css'
import './styles/color-overrides.css'
import App from './App.tsx'

// PWA / Service Worker registration (Workbox runtime caching includes images)
import { registerSW } from 'virtual:pwa-register'

// Overlayscrollbars: import styles and init globally so all scrollable areas get styled
import 'overlayscrollbars/styles/overlayscrollbars.css'
import { OverlayScrollbars } from 'overlayscrollbars'
import { initScrollbars } from './lib/scrollbars'

const rootElement = document.getElementById('root')!;

// Check if the app was server-rendered
if (rootElement.hasChildNodes()) {
  // Hydrate the server-rendered HTML
  hydrateRoot(
    rootElement,
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} else {
  // Client-side render if not server-rendered
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

// Initialize Overlayscrollbars on the document body so scrollbars across the app are replaced
// We keep this outside the render so it runs once on load. Use a custom theme class so we can
// style it with CSS variables in `src/index.css`.
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore - overlayscrollbars type checks can be strict; cast options to any to avoid errors
    OverlayScrollbars(document.body, {
      className: 'os-theme-custom',
      scrollbars: {
        autoHide: 'leave',
        clickScroll: true,
        dragScroll: true
      }
    } as any)
  } catch (e) {
    // initialization failed (edge-case). We silently ignore so app still works with native scrollbars.
    // console.warn('OverlayScrollbars init failed', e)
  }
}

// Also attach Overlayscrollbars to all modals, drawers and overflow containers dynamically
initScrollbars()

// Register Service Worker as early as possible so image requests can be served from cache.
// Note: The SW will start controlling the page after the first load + refresh.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // One-time migration: older SW versions cached *all* API requests under "api-cache".
  // That small cache caused constant eviction + console spam (Workbox ExpirationPlugin).
  // We now keep API calls network-only and cache only API images.
  try {
    const migrationKey = 'spirithub_migrated_delete_api_cache_v1'
    if (!window.localStorage.getItem(migrationKey) && 'caches' in window) {
      // Best-effort: we don't want this to block boot.
      window.caches.delete('api-cache').finally(() => {
        window.localStorage.setItem(migrationKey, '1')
      })
    }
  } catch {
    // ignore
  }

  try {
    registerSW({
      immediate: true,
      onRegisterError(error: unknown) {
        // Keep this quiet in production—just a breadcrumb for debugging.
        console.warn('[PWA] Service Worker registration failed:', error)
      }
    })
  } catch (error) {
    console.warn('[PWA] Service Worker registration threw:', error)
  }
}
