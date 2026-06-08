# Mobile Performance Status

## Products Page

This document records the current implementation state. It does not claim a
Lighthouse improvement until the deployed production page is measured again.

## Implemented

- The products route is lazy-loaded.
- The products header renders immediately while the route chunk loads.
- The header image uses eager loading and high fetch priority.
- The first two visible product images use eager loading and high fetch priority.
- Product groups below the initial viewport are deferred.
- Product search text is prepared during API transformation, with a fallback for
  older session-cache entries.
- Category ordering reuses cached normalized values.
- Background product and category image preloading was removed.
- Inter and Cairo use `display=swap`.
- React, icons, i18n, and Radix remain separate vendor chunks.

## Reverted

Vendor consolidation was tested and then reverted after the measured result
regressed:

- CPU time increased from 11.8 seconds to 15.3 seconds.
- LCP increased from 4.0 seconds to 4.4 seconds.

The repository must not reintroduce a single consolidated vendor chunk without
a new controlled production test.

## Still Unverified

- The current production LCP.
- The current main-thread CPU time.
- Whether the previous 3.35-second LCP render delay is resolved.
- The exact source of the previously reported 10.9 seconds of products-page CPU.

## Next Validation

After deployment, run Lighthouse mobile against the production products URL at
least three times with the same device and network settings. Compare the median
LCP, Total Blocking Time, main-thread work, and JavaScript execution time.
