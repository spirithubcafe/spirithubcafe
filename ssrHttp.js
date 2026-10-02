/** @template T
 * @typedef {{kind: 'FOUND', data: T} | {kind: 'NOT_FOUND', status: 404 | 410, data?: T} |
 * {kind: 'TEMPORARY_FAILURE', reason: string}} SsrOutcome
 */

/** @returns {{kind: 'TEMPORARY_FAILURE', reason: string}} */
export const temporaryFailure = (reason) => ({ kind: 'TEMPORARY_FAILURE', reason });

/**
 * Only an individual-resource 404/410 establishes absence. Empty/malformed
 * successes and all other errors leave existence unresolved.
 * @returns {Promise<SsrOutcome<unknown>>}
 */
export const fetchSsrJson = async (url, headers, {
  individual = false,
  validate = () => true,
  timeoutMs = 6000,
  maxAttempts = 3,
  retryDelayMs = 300,
} = {}) => {
  let reason = 'Unresolved upstream response';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let retryable = true;
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (individual && (response.status === 404 || response.status === 410)) {
        return { kind: 'NOT_FOUND', status: response.status };
      }
      if (!response.ok) {
        reason = `Upstream HTTP ${response.status}`;
        retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      } else {
        const body = await response.json();
        if (body?.success === false || !validate(body)) {
          reason = 'Invalid or empty upstream payload';
        } else {
          return { kind: 'FOUND', data: body };
        }
      }
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timeout);
    }
    if (!retryable || attempt === maxAttempts) break;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
  }
  console.warn(`[SSR] ${url} failed after bounded attempts (region=${headers['X-Branch']}, language=${headers['Accept-Language']}): ${reason}`);
  return temporaryFailure(reason);
};

export const getProductIdentifier = (url) => {
  const pathname = url.split('?')[0].split('#')[0].replace(/^\/(om|sa)(?=\/|$)/, '');
  const match = pathname.match(/^\/(?:products|shop\/product)\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};

/** @returns {Promise<SsrOutcome<string>>} */
export const renderSsrOutcome = async (render, url, language, bootstrap) => {
  try {
    if (typeof render !== 'function') throw new Error('SSR renderer unavailable');
    const result = await render(url, language, bootstrap);
    if (result?.error || typeof result?.html !== 'string' || !result.html.trim()) {
      throw new Error(result?.error || 'SSR produced no reliable content');
    }
    const notFound = result.html.includes('data-not-found-page="true"');
    if (notFound && (bootstrap?.product || bootstrap?.shop?.category)) {
      throw new Error('SSR rendered NotFound for a confirmed existing resource');
    }
    return notFound
      ? { kind: 'NOT_FOUND', status: 404, data: result.html }
      : { kind: 'FOUND', data: result.html };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[SSR] Render failed for ${url}: ${reason}`);
    return temporaryFailure(reason);
  }
};

export const errorMetaTags = (status) => {
  const title = status === 404 ? 'Page Not Found | Spirit Hub Cafe' : 'Temporarily Unavailable | Spirit Hub Cafe';
  const description = status === 404 ? 'The requested page could not be found.' : 'Please try again later.';
  return `<title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="noindex, follow">`;
};

export const sendSsrUnavailable = (res) => {
  setErrorHeaders(res);
  return res.status(503).send(`<!doctype html><html lang="en"><head><meta charset="utf-8">${errorMetaTags(503)}</head><body><main><h1>Temporarily unavailable</h1><p>Please try again later.</p></main></body></html>`);
};

export const setErrorHeaders = (res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
};

export const replaceErrorHead = (html, status) =>
  html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, (head) => {
    // Retain assets and hydration data, but remove all sales/discovery metadata.
    const cleaned = head
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|keywords|twitter:[^"']+)["']|property=["'](?:og|product|article):[^"']+["'])[^>]*>/gi, '')
      .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
      .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
    return cleaned.replace('</head>', `${errorMetaTags(status)}</head>`);
  });
