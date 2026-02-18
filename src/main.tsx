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
import { ErrorBoundary } from './components/pages/ErrorBoundary'

// Overlayscrollbars: import styles and apply to document.body only.
// NOTE: Do NOT apply OverlayScrollbars to React-managed elements — it restructures
// the DOM (wrapping children in os-viewport/os-content) which breaks React's fiber
// references and causes "removeChild: node is not a child" crashes.
import 'overlayscrollbars/styles/overlayscrollbars.css'
import { OverlayScrollbars } from 'overlayscrollbars'

const rootElement = document.getElementById('root')!;

// Check if the app was server-rendered.
// We rely on the data-ssr attribute injected by api/ssr.js rather than
// hasChildNodes() which can return true spuriously (browser extensions,
// injected whitespace nodes, etc.).
const isSSR = rootElement.getAttribute('data-ssr') === 'true';

if (isSSR) {
  // Hydrate the server-rendered HTML
  hydrateRoot(
    rootElement,
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  // Client-side render (no SSR content injected)
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
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

// Unregister any existing service workers and clear caches (PWA removed)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
}
