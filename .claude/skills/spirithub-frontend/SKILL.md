---
name: spirithub-frontend
description: Build or change any SpiritHub storefront UI — components, sections, pages, icons, animation, styling, loading/skeleton states, RTL/Arabic layout. Use before writing or editing any .tsx under src/components or src/pages.
---

# SpiritHub frontend playbook

Read `CLAUDE.md` first; this skill expands its UI rules into a procedure.

## 1. Before you write code

1. Find the closest existing component and copy its conventions (spacing helper, tokens, i18n hooks).
   - Homepage section spacing: `homepageSectionClassName()` from `src/components/sections/homepageSectionSpacing.ts`.
   - Product cards: `src/components/products/ProductCard.tsx` (`variant="homepage"` on the homepage).
   - Grid loading states: follow §4.
2. Check whether a shadcn / Animate UI component already solves it (§2) before writing a custom one.

## 2. Components and icons (shadcn + Animate UI)

- The shadcn MCP server is configured in `.mcp.json`; use it to search registries and view items before installing.
- Install with the CLI so files land in the configured aliases (`components.json`):
  ```bash
  npx shadcn@latest view @animate-ui/<item>    # inspect first
  npx shadcn@latest add @animate-ui/<item>     # then install
  ```
  Animate UI items are namespaced (e.g. `components-…`, `icons-…`); confirm exact names with the MCP search or `view`.
- After installing, read the generated file: check its imports (`motion/react`, Radix), props, and that `npm run build` passes.
- **Icons:**
  - Animate UI animated icons for interactive or prominent UI: header actions, cart, wishlist, CTAs, empty states, success/error feedback.
  - Trigger animation on hover/tap or on a state change — never loop continuously in view (battery, distraction, INP).
  - `lucide-react` stays for static, decorative, dense lists and the admin panel. Do not mix both styles inside one control group.
  - Sizes: `size-4` inline text, `size-5` buttons and nav, `size-6` hero/feature. Icon-only buttons need a translated `aria-label`.
- Never hand-copy component code from a website; never add a second UI kit.

## 3. Animation (motion)

- Library: `motion` → `import { motion, AnimatePresence, useReducedMotion } from 'motion/react'`. No new `framer-motion` imports; when you touch a file that uses it, migrate the import (same API).
- Animate only `transform` and `opacity`. Never animate width/height/top/left/margin (layout shift).
- Durations: 150–250 ms micro-interactions, 300–500 ms section reveals; ease-out on enter.
- Reduced motion: `const reduce = useReducedMotion();` — skip or shorten the animation when true.
- Entrance animations must not change layout: the element already occupies its final space; animate from `opacity: 0` / a small `translateY`.

## 4. Loading states — skeleton parity (prevents page jumps)

A skeleton has **the same outer size** as the loaded content at every breakpoint:
- Mirror the real structure: section spacing, header (eyebrow + heading line-heights), grid columns, card aspect ratio, text-row heights (the real card's `min-h-*`), and any CTA below the grid.
- Carousels: one row of placeholders matching the visible slide count per breakpoint (hide extras with `hidden md:block`, …).
- Show the skeleton only when there is nothing to display: `if (loading && items.length === 0)`. The shared AppContext `loading` flag also fires for unrelated fetches — never swap loaded content back to a skeleton.
- Verify with `spirithub-performance` → "Measure layout stability".

## 5. Bilingual and RTL

- Strings: `t('key')` with the key added to **both** `src/i18n/locales/en.json` and `ar.json`. Inline `isArabic ? … : …` only where the file already uses that pattern.
- Arabic uses Cairo (`font-cairo`), English uses Inter.
- Logical utilities (`ms-/me-/ps-/pe-/start-/end-`, `text-start`); flip directional icons (`rtl:-scale-x-100`).
- Check every UI change in both `en` and `ar`.

## 6. Links and navigation

- Internal links: `<Link to={`${regionPrefix}/...`}>`, with `regionPrefix` from the current route (`/om`). Never `<a href="/...">` or `window.location` for in-app navigation.

## 7. Done checklist

- [ ] `npm run build` and `npm run lint` pass
- [ ] EN and AR, mobile (390 px) and desktop (1440 px) checked
- [ ] Keyboard focus visible; icon buttons labelled
- [ ] No layout shift when data loads (skeleton parity)
- [ ] Reduced motion respected
