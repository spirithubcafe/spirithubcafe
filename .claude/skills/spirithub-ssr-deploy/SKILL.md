---
name: spirithub-ssr-deploy
description: Change SSR/server code or ship to production safely. Use when touching api/, server.js, ssr*.js, legacyProductRedirects.js, vercel.json, entry-server.tsx or env vars; before and after any push to main; and when production returns 503 "Temporarily unavailable" or other errors.
---

# SpiritHub SSR & deploy playbook

## 1. How production works

- Vercel builds with `npm run build` (type-check → client bundle → SSR bundle in `dist/server`).
- `vercel.json` routes: static assets → `dist/…`, `/sitemap.xml` → `api/sitemap`, **every page → `api/ssr`**.
- `api/ssr.js` imports the root SSR modules (`ssrHttp.js`, `ssrProductsBootstrap.js`, `ssrRobots.js`, `legacyProductRedirects.js`), reads `dist/index.html`, loads `dist/server/entry-server.js`, fetches the page's data from the API and renders.
- SSR outcomes (`ssrHttp.js`): `FOUND` → 200, `NOT_FOUND` (upstream 404/410 only) → 404, `TEMPORARY_FAILURE` → **503 "Temporarily unavailable" + noindex**. A 503 means: the API fetch failed or timed out, the renderer failed to load, or the handler threw.
- `server.js` is the local/standalone Express server with the same behaviour (`npm run dev`, `npm run serve`).

## 2. Changing SSR or deploy files

1. Keep `api/` at the repo root. Do not move or rename the root SSR modules or change `vercel.json` routes casually — Vercel bundles functions by tracing imports, and a local server cannot reproduce Vercel's environment.
2. Run the real handler locally before pushing:
   ```bash
   npm run build
   node --input-type=module -e '
   import handler from "./api/ssr.js";
   const res = { statusCode: 200, setHeader() {}, status(c) { this.statusCode = c; return this; },
     send(b) { console.log(this.statusCode, String(b).length); }, end() { console.log("end", this.statusCode); } };
   await handler({ url: "/om", method: "GET", headers: { host: "www.spirithubcafe.com" } }, res);'
   ```
3. Run `npm run test:ssr-http`, `npm run test:shop-ssr`, `npm run test:category-ssr-render`.
   - **Dependency externals:** packages listed in `ssr.external` (`vite.config.ts`) are loaded from `node_modules` at runtime, and Vercel packages only the files its tracer finds. Packages whose `exports` use the `module-sync` condition (react-router, react-router-dom) were traced as `.mjs` but resolved as `.js` at runtime → every page 503'd on 2026-10-17. Keep such packages in `ssr.noExternal`, and check new externals' `exports` before adding them.
4. Deploy to a **Vercel preview** (push a branch or open a PR) and verify the preview URL (§3) before merging to `main`.

## 3. Verify production (after every push to main)

Wait for the Vercel deployment to finish (2–5 min; check the Vercel dashboard), then:
```bash
for p in /om /om/products /om/shop /om/about /sitemap.xml; do
  curl -s -o /dev/null -w "%{http_code}  $p\n" "https://www.spirithubcafe.com$p?v=$RANDOM"
done
```
All must return 200 (a product URL that does not exist must return 404, not 503). Then open `/om` on mobile and desktop and check the browser console.

## 4. Production incident: 503 "Temporarily unavailable"

1. **Restore first.** Vercel dashboard → Deployments → last good deployment → *Instant Rollback* (seconds, no git change). Without dashboard access: `git revert` the suspect commits, `npm run build`, push, verify (§3).
2. **Then diagnose** in Vercel → Logs → function `api/ssr`:
   - `[SSR] render failed: …` → renderer or bundle problem (file missing from the function, SSR exception).
   - `SSR Error: …` → the handler threw (e.g. `dist/index.html` missing).
   - 503 without those lines → upstream API failure or timeout. Check the API from outside (`curl https://api.spirithubcafe.com/api/shop`) — but the API can answer from your network and still fail from Vercel's region.
3. If the rolled-back deployment also returns 503, the cause is the environment (API, env vars, Vercel), not the code.
4. Record the cause and the fix in the commit message.

## 5. Push rules

- `npm run build` and the relevant tests pass locally before every push.
- One logical change per commit, descriptive message.
- SSR/deploy changes go through a preview deployment, never straight to `main`.
- After pushing, verify (§3). If anything fails, roll back immediately (§4).
