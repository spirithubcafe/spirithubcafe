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

const rootElement = document.getElementById('root')!;
const CHUNK_RELOAD_GUARD_KEY = 'spirithub_chunk_reload_once';

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

    let alreadyReloaded = false;
    try {
      alreadyReloaded = window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1';
    } catch {
      alreadyReloaded = false;
    }

    if (alreadyReloaded) {
      console.error('[chunk-recovery] chunk load failed after one auto-reload; showing fallback UI.', error);
      return;
    }

    try {
      window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
    } catch {
      // Storage can be blocked in some mobile browsers. Reload once anyway.
    }
    console.warn('[chunk-recovery] chunk load failure detected; reloading once to recover from stale assets.');
    window.location.reload();
  };

  window.addEventListener('error', (event) => {
    recoverFromChunkError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    recoverFromChunkError(event.reason);
  });

  // Reset guard after a successful page load cycle so future deployments can recover once again.
  window.addEventListener(
    'pageshow',
    () => {
      try {
        window.sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
      } catch {
        // ignore
      }
    },
    { once: true },
  );
}

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
