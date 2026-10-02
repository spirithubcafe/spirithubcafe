import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import '@fontsource-variable/inter/index.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/700.css';
import 'overlayscrollbars/overlayscrollbars.css'
import './index.css'
import './styles/color-overrides.css'
import App from './App.tsx'
import type { ProductsSsrBootstrap } from './lib/productTransform';

const rootElement = document.getElementById('root')!;
const CHUNK_RELOAD_GUARD_KEY = 'spirithub_chunk_reload_once';
const CHUNK_RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

// Read the request's product/category snapshot before the first hydration render.
// Both SSR handlers inject it only for product listing routes.
const ssrGlobals = window as unknown as {
  __SSR_PRODUCTS__?: unknown;
  __SSR_PRODUCTS_REGION__?: unknown;
  __SSR_CATEGORIES__?: unknown;
};
const productsBootstrap: ProductsSsrBootstrap | undefined = ssrGlobals.__SSR_PRODUCTS__
  ? {
      products: Array.isArray(ssrGlobals.__SSR_PRODUCTS__) ? ssrGlobals.__SSR_PRODUCTS__ : null,
      categories: Array.isArray(ssrGlobals.__SSR_CATEGORIES__) ? ssrGlobals.__SSR_CATEGORIES__ : null,
      region: typeof ssrGlobals.__SSR_PRODUCTS_REGION__ === 'string' ? ssrGlobals.__SSR_PRODUCTS_REGION__ : null,
    }
  : undefined;

if (typeof window !== 'undefined') {
  const isChunkLoadError = (error: unknown): boolean => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';

    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      message.includes('Importing a module script failed')
    );
  };

  const recoverFromChunkError = (error: unknown) => {
    if (!isChunkLoadError(error)) return;

    let lastReloadAt = 0;
    try {
      const storedValue = window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY);
      lastReloadAt = storedValue ? Number(storedValue) : 0;
    } catch {
      lastReloadAt = 0;
    }

    const now = Date.now();
    if (lastReloadAt > 0 && now - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
      console.error('[chunk-recovery] chunk load failed during recovery cooldown; suppressing another reload.', error);
      return;
    }

    try {
      window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(now));
    } catch {
      // Storage can be blocked in some mobile browsers. Reload once anyway.
    }
    console.warn('[chunk-recovery] chunk load failure detected; performing one guarded reload.', error);
    window.location.reload();
  };

  window.addEventListener('error', (event) => {
    recoverFromChunkError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    recoverFromChunkError(event.reason);
  });

}

// Check if the app was server-rendered
if (rootElement.hasChildNodes()) {
  // Hydrate the server-rendered HTML
  hydrateRoot(
    rootElement,
    <StrictMode>
      <BrowserRouter>
        <App bootstrapData={productsBootstrap} />
      </BrowserRouter>
    </StrictMode>
  );
} else {
  // Client-side render if not server-rendered
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App bootstrapData={productsBootstrap} />
      </BrowserRouter>
    </StrictMode>,
  );
}

if (typeof window !== 'undefined') {
  const scheduleLowPriorityWork = (task: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(task, { timeout });
      return;
    }
    globalThis.setTimeout(task, timeout);
  };

  const initDeferredEnhancements = () => {
    scheduleLowPriorityWork(() => {
      const migrationKey = 'spirithub_sw_cleanup_v1';
      if (window.localStorage.getItem(migrationKey) === 'done') {
        return;
      }

      if (!('serviceWorker' in navigator)) {
        window.localStorage.setItem(migrationKey, 'done');
        return;
      }

      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });

      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      window.localStorage.setItem(migrationKey, 'done');
    }, 3000);
  };

  if (document.readyState === 'complete') {
    initDeferredEnhancements();
  } else {
    window.addEventListener('load', initDeferredEnhancements, { once: true });
  }
}
