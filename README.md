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
No HTTP status handling is changed.

Run `npm run build` then `npm run test:shop-ssr` for bootstrap and actual
SSR regression coverage, including concurrent Oman/Saudi requests.
