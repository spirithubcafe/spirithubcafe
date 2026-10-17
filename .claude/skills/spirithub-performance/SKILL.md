---
name: spirithub-performance
description: Keep the SpiritHub site fast and jump-free. Use when adding a dependency, Three.js/3D, video, large images, animations, lazy loading or deferred sections, and to measure Core Web Vitals or investigate "the page jumps / reloads / is slow".
---

# SpiritHub performance playbook

Budgets (from `CLAUDE.md`): mobile LCP ≤ 2.5 s · CLS ≤ 0.05 · INP ≤ 200 ms · initial JS growth ≤ 10 KB gzip per change.
Background: `MOBILE_PERF_SUMMARY.md` and `MOBILE_PERF_RECOMMENDATIONS.md` (read the "Do not reintroduce" list).

## 1. Adding a dependency

1. Check size first (build and compare `dist/assets` sizes, or bundlephobia).
2. Prefer what is already installed: `motion`, Radix, embla, swiper, recharts (admin only). Never add a library that duplicates one of these.
3. Anything not needed for the first paint is imported lazily (`React.lazy`, dynamic `import()`) and stays out of the entry chunk.
4. Keep vendor chunks split as configured in `vite.config.ts` (`manualChunks`). Do not merge them (measured regression: CPU 11.8 s → 15.3 s).

## 2. Three.js / 3D rules

3D is a progressive enhancement, never a requirement:
- **At most one scene per page**, only where it supports the product story (e.g. a hero coffee bean or bag). No 3D in lists, cards, checkout or admin.
- Load it lazily **after** the LCP element has painted and the browser is idle (`requestIdleCallback`), and only when its container is near the viewport.
- SSR and first paint show a static poster image of the same size; the canvas fades in on top — zero layout shift.
- Keep the poster (skip 3D) when: `prefers-reduced-motion`, `navigator.connection.saveData`, `navigator.deviceMemory < 4`, or no WebGL. On mobile prefer the poster unless the scene is tiny.
- Use `three` directly or `@react-three/fiber` — pick one project-wide. Import only what you use, cap `devicePixelRatio` at 2, pause rendering when off-screen or the tab is hidden, dispose geometries/materials/textures on unmount.
- Compressed assets only (glTF with Draco/Meshopt, KTX2/WebP textures); total scene download ≤ 300 KB.

## 3. Images and video

- Always `width`/`height` or an `aspect-*` class. WebP/AVIF with `srcSet` + `sizes`.
- Only the LCP image is `loading="eager"` + `fetchPriority="high"`; everything else `loading="lazy"`.
- Background video: `muted playsInline preload="none"` with a poster; start only when visible; skip on data-saver.

## 4. Deferred sections and lazy loading

- Below-the-fold homepage sections are mounted by an IntersectionObserver with a positive bottom `rootMargin` (about one viewport) so they finish loading off-screen. Keep the margin small enough that nothing mounts during the initial mobile load.
- Placeholders before mount approximate the final height; loaded skeletons must match exactly (`spirithub-frontend` §4).

## 5. Measure layout stability (the "page jumps" check)

Chrome hides many jumps with scroll anchoring; iOS Safari does not. Measure with anchoring **off**:
1. `npm run build && npm run serve` (restart the server after each rebuild — it caches `index.html`).
2. Drive a 390×844 mobile viewport (Playwright or Chrome DevTools MCP), inject `*{overflow-anchor:none !important}`, scroll in 400 px steps with ~500 ms pauses.
3. Record `layout-shift` entries (PerformanceObserver, `buffered: true`) and a `ResizeObserver` on every `<section>`; flag any section whose height changes while its top is above the viewport.
4. Repeat with an artificial API delay (≈1.5 s per request) — fast networks hide skeleton mismatches.
5. Locally the production API rejects `localhost` (CORS); route API requests through the test browser and add CORS headers rather than changing app code.
6. Pass: CLS ≤ 0.05 and **no** section resizes above the viewport, on mobile and desktop.

For load metrics, run Lighthouse (mobile, simulated throttling) on `/om` and `/om/products` and compare against the previous build.

## 6. Red flags — fix immediately

- `window.location.reload()` loops; `<a href="/...">` internal links (full reloads)
- Skeleton shown over already-loaded content
- Animating width/height/top/margin; infinite animations in view
- New dependency in the entry chunk; 3D or charts loaded on first paint
