# Spirit Hub Café

## About Spirit Hub

Founded in Oman, SPIRIT HUB Roastery & Specialty Coffee is dedicated to elevating the coffee experience for its customers. With a strong focus on specialty coffee, our team highlights the unique flavors and aromas of each batch, ensuring every cup tells a story.

We deeply value the hard work of farmers who cultivate and harvest our beans. By showcasing their dedication, SPIRIT HUB recognizes their essential contributions to the global coffee industry.

Our passion goes beyond appreciation we emphasize the science of coffee. From roasting precision to brewing mastery, every step is carefully studied to deliver a distinctive and memorable experience.

As a business exclusively operated by an Omani team, SPIRIT HUB proudly supports the local economy and community, helping strengthen the foundation of specialty coffee in Oman.

SPIRIT HUB is more than a roastery it is a commitment to quality, sustainability, and community. Every cup reflects dedication to excellence, the farmers who make it possible, and the spirit of Oman.

## Product category SSR

Product listings bootstrap products and public coffee categories together, using
the same branch and language headers as the client. The existing bootstrap cache
is keyed by region and language; each render receives its own snapshot argument.
Categories are also serialized for the client's first hydration render so category
slugs resolve to IDs before filtering. Background client fetching and retries
remain enabled. A failed category refresh preserves valid same-region categories.

Run `npm run test:category-ssr` for category mapping and bootstrap regressions.
Run `npm run build` followed by `npm run test:category-ssr-render` to verify actual
server-rendered product sets for slug, numeric, invalid, and regional filters.
Existing catalog checks are `npm run test:products-ssr` and
`npm run test:products-resilience`.

## Shop SSR

Shop routes use the same request-scoped bootstrap/hydration handoff. `/shop`
fetches `/api/shop`; category routes fetch the shop page and category-by-slug
in parallel, then fetch the category's first product page using its regional ID.
The paginated endpoint remains authoritative for product ordering and counts.
The coffee category lookup above excludes shop categories and is not substituted
for the dedicated shop response.

Successful snapshots are cached for 60 seconds by region, language, and slug.
Failed category/product snapshots are not cached as missing categories. Hooks
hydrate from the snapshot and retain their three-attempt background retry and
15-minute session cache, keeping snapshot content visible if refresh fails.
Obsolete client requests cannot replace a different region/category/page/sort.
The initial shop route module is loaded before hydration so existing provider
effects do not replace the snapshot with a lazy-route fallback.
HTTP responses use the explicit SSR outcomes described below.

Run `npm run build` then `npm run test:shop-ssr` for bootstrap and actual
SSR regression coverage, including concurrent Oman/Saudi requests.

## SSR HTTP status handling

Production SSR uses `FOUND`, `NOT_FOUND`, and `TEMPORARY_FAILURE` outcomes.
Only an upstream 404/410 from the requested individual product/category endpoint
confirms absence. Empty successful collections are valid 200 responses; empty
individual payloads, malformed responses, network/timeout errors, 408/429/5xx,
and incomplete required bootstraps produce 503 rather than a false 404 or 200.
Transient upstream errors use at most three attempts with 300/600ms backoff and
a six-second per-attempt timeout. Successful snapshots alone enter the existing
region/language-scoped caches; failure and absence outcomes are not cached.

Both SSR handlers return 503 for renderer/import/stream failures or empty output.
Product content is handed to rendering through request-scoped context rather
than mutable server globals. Confirmed resource 404s use the existing NotFound UI.
Error responses omit sales schema and canonical/hreflang metadata. Successful
page cache policy remains unchanged; 404 and 503 responses send:

```text
Cache-Control: no-store, max-age=0
CDN-Cache-Control: no-store
Vercel-CDN-Cache-Control: no-store
X-Robots-Tag: noindex, follow
```

No `Retry-After` is sent because the upstream recovery time is unknown.
Intentional development SPA mode (`VITE_DEV_SSR` disabled) remains SPA mode.
Run `npm run build` followed by `npm run test:ssr-http` for response-level
regressions using the actual SSR renderer and simulated upstream failures.
The suite also starts an isolated standalone production server against a local
test upstream and verifies both regions over HTTP; it closes both on completion.

SSR and the hydrated SEO component emit only the existing `en-OM`, `ar-OM`,
and `x-default` alternates. No Saudi hreflang is generated without a verified
page-level equivalence map and reciprocal implementation. The client also removes
stale `en-SA`/`ar-SA` alternate tags. Canonicals, legacy Saudi routing, regional
API behavior, and the external Saudi country-switcher destination are unchanged.

## Oman legacy product redirects

`legacyProductRedirects.js` contains nine approved, immutable exact-path Oman
product aliases shared by the Vercel and standalone handlers. Both handlers
return 301 before API/bootstrap lookup, metadata, or rendering. A single
trailing slash is accepted, and the original query string is preserved verbatim.
Redirect destinations use the current `/om/products/...` path.

Saudi, unapproved/inactive products, and regionless routing are unchanged.
No fuzzy matching or missing-product fallback redirects are used. Regionless
old URLs retain their existing routing, including the Vercel `/om` redirect.
Run `npm run test:ssr-http` after building to validate the approved map, prevent
loops/chains, and exercise both handlers and regional isolation.
