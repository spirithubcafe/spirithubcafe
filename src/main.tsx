import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Import fonts
import '@fontsource-variable/inter/index.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/700.css';

import './index.css'
import './styles/color-overrides.css'
import App from './App.tsx'

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
  const scheduleLowPriorityWork = (task: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(task, { timeout });
      return;
    }
    globalThis.setTimeout(task, timeout);
  };

  const initDeferredEnhancements = () => {
    scheduleLowPriorityWork(async () => {
      try {
        await import('overlayscrollbars/styles/overlayscrollbars.css');
        const [{ OverlayScrollbars }, { initScrollbars }] = await Promise.all([
          import('overlayscrollbars'),
          import('./lib/scrollbars')
        ]);

        // @ts-ignore - overlayscrollbars type checks can be strict; cast options to any to avoid errors
        OverlayScrollbars(document.body, {
          className: 'os-theme-custom',
          scrollbars: {
            autoHide: 'leave',
            clickScroll: true,
            dragScroll: true
          }
        } as any);

        initScrollbars();
      } catch {
        // Ignore enhancement failures so first paint is never blocked.
      }
    });

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
