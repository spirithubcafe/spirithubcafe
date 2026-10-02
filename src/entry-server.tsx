import { renderToReadableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import i18n from './i18n';
import type { ProductsSsrBootstrap } from './lib/productTransform';

/**
 * Server-side render the application for the given URL.
 *
 * Returns { html } on success or { html: '', error } when the render
 * throws (e.g. browser-only code used in a component). The caller must
 * respond with HTTP 503 rather than a successful SPA shell.
 *
 * `bootstrapData` (products list + region) is passed as a plain function
 * argument rather than a mutable global, so concurrent SSR requests never
 * share state with one another.
 */
export async function render(
  url: string,
  language: 'ar' | 'en' = 'ar',
  bootstrapData?: ProductsSsrBootstrap,
): Promise<{ html: string; error?: string }> {
  try {
    await i18n.changeLanguage(language);
    let renderError: string | undefined;
    const stream = await renderToReadableStream(
      <StaticRouter location={url}>
        <App bootstrapData={bootstrapData} />
      </StaticRouter>,
      {
        onError(error: unknown) {
          renderError = error instanceof Error ? error.message : String(error);
          console.warn(`[SSR] Stream failed for ${url}: ${renderError}`);
        },
      },
    );
    await stream.allReady;
    const html = await new Response(stream).text();
    if (renderError) return { html: '', error: renderError };
    return { html };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Log once on the server so we can fix the root-cause components over time.
    console.warn(`[SSR] Render failed for ${url}: ${message}`);
    return { html: '', error: message };
  }
}
