# SEO Audit & Improvement Report — Spirit Hub Cafe

**Project:** spirithubcafe.com + spirithub.sa  
**Stack:** React 19 + Vite SSR + Express  
**Date:** May 15, 2026

---

## Executive Summary

A full technical SEO audit was performed across 15 files. **15 issues** were identified and fixed, ranging from critical security/rendering bugs to structural improvements that directly affect crawlability, indexability, and rich results eligibility.

---

## Critical Fixes

### 1. XSS / Broken Meta Tags in SSR (`server.js`)

**Problem:** Product names and descriptions were injected directly into HTML `<meta content="...">` without HTML escaping. A product name containing `"` or `<` would break the entire `<head>` block, causing crawlers to receive malformed HTML.  
**Fix:** Introduced `escapeHtmlAttr()` applied to every value injected into meta tags.

---

### 2. Missing Meta Tags for 10+ Routes (`server.js`)

**Problem:** Only 4 routes had unique SSR meta tags. Pages like `/faq`, `/loyalty`, `/shop`, `/privacy`, `/terms`, `/delivery`, `/refund`, `/login`, `/register` all fell back to identical default meta tags — creating massive duplicate content.  
**Fix:** Added per-route title, description, and keywords for every indexable page, in both English and Arabic, with region-aware copy (Oman vs. Saudi Arabia).

---

### 3. FAQPage Structured Data Producing `[object Object]` (`FAQPage.tsx`)

**Problem:** The `FAQPage` JSON-LD used `array.join('\n')` on an array that contained JSX React elements. This serialized JSX as `[object Object]`, causing Google's Rich Results Test to reject the FAQ schema entirely — losing potential FAQ rich snippets in search results.  
**Fix:** Introduced a `flattenAnswer()` utility that extracts plain text from React nodes before serialization.

---

## High-Impact Fixes

### 4. Incorrect OG Image Dimensions

**Problem:** Server-side rendered `og:image:width/height` was set to `1080×1080`. Facebook, Twitter, and WhatsApp all prefer `1200×630` for link previews.  
**Fix:** Updated to `1200×630` across both SSR (`server.js`) and client-side (`Seo.tsx`).

---

### 5. Default OG Image Was an App Icon

**Problem:** The fallback social sharing image was `/images/icon-512x512.png` — a small square app icon. Every page without a specific image (about, contact, FAQ, etc.) showed this as its preview when shared on social media.  
**Fix:** Changed default to `/images/slides/premium-specialty-coffee-roasted-in-oman.webp`, a proper landscape banner image.

---

### 6. Canonical URL Inconsistency (Region Prefix)

**Problem:** `ProductDetailPage` and `ProductsPage` generated canonical URLs as `spirithubcafe.com/products/slug` (no `/om`), while the server-side rendered canonical used `spirithubcafe.com/om/products/slug`. Google would see two competing canonical signals for the same page.  
**Fix:** Both pages now derive the canonical URL from `currentRegion.code` to produce the correct region-prefixed URL (`/om/...` for Oman, root for SA on spirithub.sa).

---

### 7. Product JSON-LD Missing in SSR Output

**Problem:** When Googlebot crawled a product page, the `<head>` contained no JSON-LD structured data — only client-side React would inject it after JavaScript execution. Googlebot may not wait for JS.  
**Fix:** Server-side route handler now generates and injects `Product` + `BreadcrumbList` JSON-LD schemas directly into the SSR HTML for all `/products/:slug` routes.

---

### 8. `og:locale` Always Set to `en-OM`

**Problem:** The `og:locale` meta tag was hardcoded to `en-OM` regardless of the user's language or region. An Arabic-speaking Saudi user would see `en-OM` as the page locale, confusing social sharing platforms.  
**Fix:** Locale is now dynamically computed from `language` + `region`: `ar_SA`, `en_SA`, `ar_OM`, or `en_OM`.

---

### 9. WebP Images Breaking WhatsApp Previews (`Seo.tsx`)

**Problem:** WhatsApp's link preview crawler does not support WebP images. Product images served as `.webp` would fail to appear in WhatsApp shares.  
**Fix:** WebP images are now automatically proxied through `wsrv.nl` to JPEG (`?output=jpg&w=1200&h=630`) for all Open Graph and Twitter Card image tags.

---

## Structural & Infrastructure Fixes

### 10. `robots.txt` — Missing Disallow Rules

**Problem:** Private pages (`/checkout`, `/payment`, `/reset-password`, `/forgot-password`, `/wholesale/`, region-prefixed variants `/om/...`, `/sa/...`) were not disallowed. Crawlers could waste budget on these pages.  
**Fix:** Added complete Disallow rules for all private/transactional URLs across both regions.

---

### 11. Dynamic Sitemap Missing Saudi Arabia & Key Pages

**Problem:** The live `/sitemap.xml` (generated dynamically) only contained Oman pages and was missing `/loyalty`, `/shop`, and all Saudi Arabia URLs.  
**Fix:** Added Saudi Arabia static pages (via `spirithub.sa`) and all missing routes. Product URLs are now generated for both regions.

---

### 12. Static Fallback `sitemap.xml` — Wrong URL Structure

**Problem:** The static fallback sitemap used URLs like `spirithubcafe.com/products/slug` (no `/om`), contradicting the canonical URL structure.  
**Fix:** All URLs updated to `spirithubcafe.com/om/...` for Oman and `spirithub.sa/...` for Saudi Arabia. Saudi Arabia pages added.

---

### 13. `ShopCategoryPage` — No Structured Data

**Problem:** Category pages (e.g., `/shop/filter-pour-over-coffee`) had zero JSON-LD, no keywords, and a weak fallback description.  
**Fix:** Added `BreadcrumbList` + `CollectionPage` schemas, region-aware canonical URL, keywords, and auto-generated descriptions.

---

### 14. Login/Register Pages Not Marked `noindex`

**Problem:** These pages were blocked in `robots.txt` but had no `<meta name="robots" content="noindex">` — relying solely on robots.txt is not sufficient best practice.  
**Fix:** Added `noindex, nofollow` meta robots to both pages.

---

### 15. `nginx.conf` — Missing Security & SEO Headers

**Problem:** No HTTPS redirect, no HSTS, no `Referrer-Policy`, no `Permissions-Policy`. HTTPS is a confirmed Google ranking signal.  
**Fix:** Added HTTP→HTTPS redirect, `Strict-Transport-Security` (1 year + preload), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and proper `www→non-www` redirect.

---

## Additional Improvements

| Item | Change |
|---|---|
| `index.html` | Added fallback `<title>`, `<meta description>`, `og:image`, `og:image:alt` for cases where SSR fails |
| `manifest.webmanifest` | Added `categories`, `shortcuts`, `screenshots`, fixed `start_url` to `/om` |
| `og:image:alt` | Added across SSR and client-side (accessibility + Twitter requirement) |
| `Product` schema | Added `itemCondition`, `url`, `seller.url`, multi-level `BreadcrumbList` with category |
| `ProductsPage` schema | Upgraded from single object to `[BreadcrumbList, CollectionPage]` array |
| `siteMetadata.ts` | Expanded keywords list (capsules, filter coffee, Saudi Arabic terms) |
| `resolvedCanonical` | Removed `window.location.origin` dependency (SSR safety) |

---

## Files Modified

| File | Description |
|---|---|
| `server.js` | HTML escaping, 10+ new route meta tags, JSON-LD SSR injection, OG image fix |
| `index.html` | Fallback title, description, OG tags |
| `public/robots.txt` | Full Disallow rules for all private pages across both regions |
| `public/sitemap.xml` | Rebuilt with `/om` prefix + Saudi Arabia pages |
| `api/sitemap.js` | Added SA static pages, loyalty, shop; product URLs for both regions |
| `src/config/siteMetadata.ts` | Better default OG image, expanded keywords |
| `src/components/seo/Seo.tsx` | Dynamic og:locale, WebP→JPEG proxy, og:image:alt, SSR-safe canonical |
| `src/pages/ProductDetailPage.tsx` | Region-aware canonical, enhanced Product schema |
| `src/pages/ProductsPage.tsx` | Region-aware canonical, BreadcrumbList schema |
| `src/pages/FAQPage.tsx` | Fixed JSON-LD serialization of JSX nodes |
| `src/pages/LoginPage.tsx` | Added noindex, nofollow |
| `src/pages/RegisterPage.tsx` | Added noindex, nofollow |
| `src/pages/Shop/ShopCategoryPage.tsx` | BreadcrumbList + CollectionPage schema, region canonical, keywords |
| `nginx.conf` | HTTPS redirect, HSTS, security headers, www redirect |
| `public/manifest.webmanifest` | categories, shortcuts, screenshots, correct start_url |

**Total:** 15 files · ~810 lines added · ~360 lines removed
