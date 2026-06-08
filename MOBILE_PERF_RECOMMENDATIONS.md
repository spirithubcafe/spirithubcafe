# Mobile Performance Recommendations

## Priority 1: Measure the Current Production Build

Run a fresh mobile Lighthouse test after deployment. Use at least three runs and
compare median values rather than relying on one run.

Record:

- LCP and its element.
- LCP resource load time versus render delay.
- Total Blocking Time.
- Main-thread JavaScript execution time.
- Products API timing.
- Long tasks from the Performance panel.

## Priority 2: Profile Products Rendering

If JavaScript execution remains high, profile the products page with React
DevTools and the browser Performance panel.

Check:

- Product card render counts.
- AppContext updates during initial loading.
- Product grouping, sorting, and filtering costs.
- Favorites subscriptions across visible product cards.
- Long tasks triggered after products or categories arrive.

Make changes only after a profile identifies the expensive function or render.

## Priority 3: Evaluate SSR Product Data Separately

Products are still fetched on the client. Server-provided initial product data
could reduce the time before the product grid is available, but it should be
implemented as a separate change because it affects caching, SSR payload size,
hydration consistency, and API failure behavior.

Required safeguards:

- Match server and client region/language selection.
- Escape serialized JSON safely.
- Avoid a duplicate client fetch during hydration.
- Keep a client-fetch fallback when server data is unavailable.
- Measure HTML size and LCP before and after deployment.

## Keep

- Separate React, icons, i18n, and Radix vendor chunks.
- `display=swap` for fonts.
- Immediate products header rendering.
- High priority only for above-the-fold images.
- Deferred rendering for lower product groups.
- Route-level fetching when homepage loading was deferred.

## Do Not Reintroduce Without Evidence

Do not consolidate all vendor dependencies into one chunk. The previous test
increased CPU time from 11.8 seconds to 15.3 seconds and LCP from 4.0 seconds to
4.4 seconds.

Do not publish projected Lighthouse scores or timing gains as achieved results.
Only report values measured from the deployed build under consistent settings.
