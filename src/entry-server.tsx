import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';

/**
 * Server-side render the application for the given URL.
 *
 * Returns { html } on success or { html: '', error } when the render
 * throws (e.g. browser-only code used in a component).  The caller
 * should fall back to serving the SPA shell on error so nothing
 * breaks for the end user.
 */
export function render(url: string): { html: string; error?: string } {
  try {
    const html = ReactDOMServer.renderToString(
      React.createElement(StaticRouter, { location: url },
        React.createElement(App)
      )
    );
    return { html };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Log once on the server so we can fix the root-cause components over time.
    console.warn(`[SSR] Render failed for ${url}: ${message}`);
    return { html: '', error: message };
  }
}
