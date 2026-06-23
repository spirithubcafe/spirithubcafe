# Image Optimization - Tier 1 Implementation Guide

## Quick Summary
This guide documents the Tier 1 performance optimizations implemented to improve TTFB, FCP, and LCP.

---

## ✅ Completed Optimizations

### 1. **HTML Caching Headers** ✅
**File:** `server.js`  
**Change:** Added `Cache-Control` headers to HTML responses
- **Production:** `public, max-age=300, stale-while-revalidate=86400`
  - Caches HTML for 5 minutes, allows stale content for up to 1 day during network issues
- **Development:** `no-cache, no-store, must-revalidate`
- **Expected Impact:** -200 to -400ms TTFB on repeat visits

### 2. **Public Image Caching Headers** ✅
**File:** `server.js`  
**Change:** Added explicit cache routes for `public/images` and other public assets
- **Images:** `public, max-age=604800, immutable` (1 week)
- **SEO files (robots.txt, sitemap.xml):** `public, max-age=3600` (1 hour, short-lived for updates)
- **Favicons, manifest:** `public, max-age=604800, immutable` (1 week)
- **Expected Impact:** -100 to -200ms on image loading (client-side cache reuse)

### 3. **Logo WebP Format Support** ✅
**File:** `src/components/layout/Navigation.tsx`  
**Change:** Updated logo to use `<picture>` element with WebP fallback
```html
<picture>
  <source srcSet={logo.webp} type="image/webp" />
  <img src={logo.png} alt="..." width={180} height={48} />
</picture>
```
- Enables WebP format (35-50% smaller than PNG)
- Falls back to PNG for older browsers
- **Expected Impact:** -5 to -10 KB per page (28 KB → 8-14 KB logo)

---

## ⚠️ TODO: WebP Image Conversion

### Images That Need WebP Versions

| File | Current Size | Target WebP Size | Savings | Priority |
|------|-------------|------------------|---------|----------|
| `/images/logo/logo-light.png` | 11.7 KB | ~4 KB | 65% | 🔴 HIGH |
| `/images/logo/logo-dark.png` | ? | ~4 KB | 65% | 🔴 HIGH |
| `/images/logo-s.png` | 28.3 KB | ~8 KB | 72% | 🔴 HIGH |
| `/images/header.webp` | 320+ KB | N/A (already WebP) | — | ✅ DONE |

### How to Convert (Choose One Method)

#### Option A: **Using ImageMagick (Recommended)**
```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Linux: apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Convert individual files
convert public/images/logo/logo-light.png -quality 80 public/images/logo/logo-light.webp
convert public/images/logo/logo-dark.png -quality 80 public/images/logo/logo-dark.webp
convert public/images/logo-s.png -quality 80 public/images/logo-s.webp

# Or batch convert all PNGs
for file in public/images/**/*.png; do cwebp -q 80 "$file" -o "${file%.png}.webp"; done
```

#### Option B: **Using cwebp (Most Efficient)**
```bash
# Install cwebp
# macOS: brew install webp
# Linux: apt-get install webp
# Windows: Download from https://developers.google.com/speed/webp/download

cwebp -q 80 public/images/logo/logo-light.png -o public/images/logo/logo-light.webp
cwebp -q 80 public/images/logo/logo-dark.png -o public/images/logo/logo-dark.webp
cwebp -q 80 public/images/logo-s.png -o public/images/logo-s.webp
```

#### Option C: **Online Tool (No Installation)**
1. Visit https://convertio.co/png-webp/ or https://www.freeconvert.com/png-to-webp
2. Upload `public/images/logo/logo-light.png`
3. Download WebP version
4. Save as `public/images/logo/logo-light.webp`
5. Repeat for other logos

#### Option D: **Node.js Script**
```bash
npm install sharp
```

Create `convert-images.js`:
```js
const sharp = require('sharp');
const path = require('path');

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`✅ Converted: ${outputPath}`);
  } catch (err) {
    console.error(`❌ Failed: ${inputPath}`, err);
  }
}

// Convert logos
convertToWebP('public/images/logo/logo-light.png', 'public/images/logo/logo-light.webp');
convertToWebP('public/images/logo/logo-dark.png', 'public/images/logo/logo-dark.webp');
convertToWebP('public/images/logo-s.png', 'public/images/logo-s.webp');
```

Run with:
```bash
node convert-images.js
```

---

## 📋 Implementation Checklist

- [x] Add HTML caching headers (5 min cache with stale-while-revalidate)
- [x] Add public image caching headers (1 week)
- [x] Update Navigation logo to use WebP with PNG fallback
- [ ] **TODO:** Convert logo-light.png → logo-light.webp
- [ ] **TODO:** Convert logo-dark.png → logo-dark.webp
- [ ] **TODO:** Convert logo-s.png → logo-s.webp
- [ ] Test logo rendering in production
- [ ] Verify WebP support in browsers using caniuse.com
- [ ] Monitor PageSpeed score improvement

---

## 🎯 Expected Performance Gains

After WebP conversion (Tier 1 Complete):

| Metric | Before | After | Gain |
|--------|--------|-------|------|
| TTFB | 1.57s | ~1.3s | -0.27s |
| FCP | 2.82s | ~2.5s | -0.32s |
| LCP | 3.36s | ~2.9s | -0.46s |
| Page Weight | 670 KB | ~660 KB | -10 KB |
| **CrUX Score** | **56%** | **~65%** | **+9%** |

---

## 🔍 Testing After Implementation

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm run serve
   ```

3. **Check Network Tab (DevTools):**
   - Verify WebP logo loads (should be smaller than PNG)
   - Check Cache-Control headers on images/HTML
   - Look for "from disk cache" entries

4. **Run PageSpeed Insights:**
   - Go to https://pagespeed.web.dev
   - Test URL: https://www.spirithubcafe.com
   - Compare with baseline (56% score)

5. **Verify Browser Compatibility:**
   - Test in Chrome/Edge (✅ WebP support)
   - Test in Firefox (✅ WebP support)
   - Test in Safari (⚠️ 16.1+ support; fallback to PNG)

---

## 📊 Tier 1 Status

**Completion:** 3/5 Items  
- ✅ Add HTTP caching headers for HTML  
- ✅ Add image caching headers  
- ✅ Update Navigation for WebP logos  
- ⏳ Convert PNG logos to WebP  
- ⏳ Remove redundant preloads (optional)

**Est. Impact When Complete:**
- **TTFB:** -200 to -400ms
- **LCP:** -0.3 to -0.5s
- **Page Weight:** -20 to -40 KB
- **Score Improvement:** +8 to +12%

---

## 💡 Next Steps

1. **Convert the 3 logo files to WebP** (highest priority)
2. **Test in production** to verify rendering works correctly
3. **Proceed to Tier 2:** Remove unused JavaScript & optimize CSS

**Questions?** Check the repo's MOBILE_PERF_SUMMARY.md for more context.
