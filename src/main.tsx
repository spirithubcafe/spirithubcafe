import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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

// Overlayscrollbars: import styles and init globally so all scrollable areas get styled
import 'overlayscrollbars/styles/overlayscrollbars.css'
import { OverlayScrollbars } from 'overlayscrollbars'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
