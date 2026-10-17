# SpiritHub Café — engineering rules

Storefront for SpiritHub Roastery (Oman; Saudi Arabia is served from spirithub.sa).
React 19 + Vite + Tailwind v4 + shadcn/ui, server-side rendered, deployed on **Vercel**.
Every change must keep the site fast, stable (no layout jumps), bilingual (EN/AR, RTL) and deployable.

These rules are mandatory. Task-specific playbooks live in `.claude/skills/`:

| Skill | Use it for |
| --- | --- |
| `spirithub-frontend` | Any UI work: components, icons, animation, styling, RTL, loading states |
| `spirithub-performance` | Anything that adds weight or motion: new libraries, Three.js, images, video, lazy loading |
| `spirithub-ssr-deploy` | `api/`, SSR files, `vercel.json`, env vars, pushing to `main`, production incidents |

## Architecture (do not change without the matching skill)

- `src/` — React app. Entry: `src/main.tsx` (client, hydrates SSR markup), `src/entry-server.tsx` (SSR render).
- `api/` — **Vercel serverless functions. Must stay at the repo root.** `vercel.json` routes every page to `api/ssr`.
- Root `server.js`, `ssrHttp.js`, `ssrProductsBootstrap.js`, `ssrRobots.js`, `legacyProductRedirects.js` — SSR server code shared by `api/ssr.js` and the local Express server.
- Data comes from the .NET API at `https://api.spirithubcafe.com` (region via `X-Branch`). Never hard-code another API host.
- Routes are region-prefixed (`/om/...`). Build internal links with the region prefix and React Router `<Link>`, never `<a href="/...">` (full reload, loses region).

## Commands

| Command | When |
| --- | --- |
| `npm run dev` | Local SSR dev server with Vite middleware |
| `npm run build` | Type-check + client + SSR bundles. **Must pass before every push.** |
| `npm run serve` | Production server against `dist/` (restart it after every rebuild — it caches `index.html`) |
| `npm run lint` | ESLint |
| `npm run test:*` | Node test suites (see `package.json`); SSR suites need `npm run build` first |

## Non-negotiable rules

### Stability
1. **No layout shift.** Every loading state reserves the exact size of the content it replaces (skeleton parity). A skeleton is never shown over content that is already loaded — background refreshes keep the old content.
2. Deferred homepage sections mount before they reach the viewport. Never mount content at the viewport edge.
3. Images and video always have an aspect ratio or explicit width/height.
4. No `window.location.reload()` or `window.location.href` for in-app navigation.

### Performance
5. Budgets: mobile LCP ≤ 2.5 s, CLS ≤ 0.05 (measured with scroll anchoring off, see `spirithub-performance`), INP ≤ 200 ms. Initial JS (gzip) must not grow by more than 10 KB per change without a written reason.
6. Heavy code (Three.js, charts, editors, admin) is lazy-loaded and never part of the initial bundle. Three.js is allowed only under the rules in `spirithub-performance`.
7. One animation library: **`motion`** (`import { motion } from 'motion/react'`). Do not add new `framer-motion` imports; migrate the files you touch.
8. Respect `prefers-reduced-motion` for every animation.

### UI
9. Use the design tokens in `src/index.css` and the shadcn primitives in `src/components/ui`. Add components with the shadcn CLI / shadcn MCP (`.mcp.json`). Animate UI is vendored in `src/components/animate-ui/` with no runtime or registry dependency on animate-ui.com (see `spirithub-frontend`). Never paste component code from websites.
10. Icons: Animate UI animated icons (via `AnimatedIcon`) for interactive or prominent icons; `lucide-react` remains allowed for static, decorative and admin icons. One size scale everywhere.
11. Every user-facing string goes through i18n (`src/i18n/locales/en.json` **and** `ar.json`). Layouts must work in RTL; use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).
12. Accessible by default: semantic elements, labels on icon-only buttons, visible focus, AA contrast.

### SSR, SEO and deploy
13. Server and client render identical markup on the first render (no `window`, `Date.now()`, `Math.random()` or storage reads during render).
14. Do not move or rename files under `api/` or the root SSR modules, and do not edit `vercel.json`, without following `spirithub-ssr-deploy` (preview deploy first).
15. Pushing to `main` deploys to production. After every push, verify production (`spirithub-ssr-deploy` → "Verify production"). If production breaks: roll back first, investigate second.

### Code quality
16. TypeScript strict; no `any` without a comment explaining why. Match the surrounding code style.
17. Business logic lives in `src/lib` / `src/services` with tests in the existing `node --test` style; UI components stay thin.
18. Never commit secrets; configuration comes from env vars (`.env.example` documents them).
