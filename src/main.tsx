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
import type { ShopRouteComponents } from './App';
import type { ProductsSsrBootstrap } from './lib/productTransform';
import { readShopBootstrap } from './lib/shopBootstrap';

const rootElement = document.getElementById('root')!;
const CHUNK_RELOAD_GUARD_KEY = 'spirithub_chunk_reload_once';
const CHUNK_RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

// Read the request's catalog snapshot before the first hydration render.
const ssrGlobals = window as unknown as {
  __SSR_PRODUCTS__?: unknown;
  __SSR_PRODUCTS_REGION__?: unknown;
  __SSR_CATEGORIES__?: unknown;
  __SSR_SHOP__?: unknown;
};
const productsBootstrap: ProductsSsrBootstrap | undefined = ssrGlobals.__SSR_PRODUCTS__ || ssrGlobals.__SSR_SHOP__
  ? {
      products: Array.isArray(ssrGlobals.__SSR_PRODUCTS__) ? ssrGlobals.__SSR_PRODUCTS__ : null,
      categories: Array.isArray(ssrGlobals.__SSR_CATEGORIES__) ? ssrGlobals.__SSR_CATEGORIES__ : null,
      region: typeof ssrGlobals.__SSR_PRODUCTS_REGION__ === 'string' ? ssrGlobals.__SSR_PRODUCTS_REGION__ : null,
      shop: readShopBootstrap(ssrGlobals.__SSR_SHOP__),
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

const mountApp = async () => {
  const shopRoutes: ShopRouteComponents = {};
  // Warm only the SSR shop route before hydration, so early provider updates
  // cannot replace its visible snapshot with the lazy-route fallback.
  if (rootElement.hasChildNodes() && productsBootstrap?.shop) {
    if (productsBootstrap.shop.categorySlug) {
      shopRoutes.category = (await import('./pages/Shop/ShopCategoryPage')).default;
    } else {
      shopRoutes.page = (await import('./pages/Shop/ShopPage')).default;
    }
  }

  if (rootElement.hasChildNodes()) {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <BrowserRouter>
          <App bootstrapData={productsBootstrap} shopRoutes={shopRoutes} />
        </BrowserRouter>
      </StrictMode>
    );
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <BrowserRouter>
          <App bootstrapData={productsBootstrap} />
        </BrowserRouter>
      </StrictMode>,
    );
  }
};

void mountApp().catch((error: unknown) => {
  console.error('[Shop] Unable to load the SSR route for hydration:', error);
  throw error;
});

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
