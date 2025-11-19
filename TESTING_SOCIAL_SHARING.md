# Testing Social Media Sharing

## Frontend Changes Made (November 19, 2025)

### 1. Enhanced SEO Component
- ✅ Added `data-react-helmet` attribute to Open Graph tags
- ✅ Ensured meta tags always update, even if content is the same
- ✅ Added `og:image:secure_url` for better compatibility
- ✅ Added `og:image:alt` and `twitter:image:alt` for accessibility
- ✅ Double-check that images are absolute URLs before setting

### 2. Improved Image URL Resolution
- ✅ Updated `resolveAbsoluteUrl` to preserve already-absolute URLs
- ✅ Enhanced Seo component to verify images are absolute
- ✅ Added fallback logic if image URL is relative

### 3. Performance Optimization
- ✅ Added preconnect and dns-prefetch to API domain in index.html
- ✅ Faster image loading for social media crawlers

## Current Limitations

⚠️ **IMPORTANT**: The frontend changes improve meta tag generation, BUT social media crawlers still cannot see dynamically generated tags because:

1. **Crawlers don't execute JavaScript**
   - Facebook, Twitter, WhatsApp crawlers fetch HTML and parse immediately
   - React app loads after the HTML is fetched
   - Meta tags are generated too late

2. **What crawlers see:**
   ```html
   <!-- They only see the static index.html -->
   <title>Spirit Hub Cafe | Specialty Coffee in Oman | سبيريت هب</title>
   <meta property="og:title" content="Spirit Hub Cafe | Specialty Coffee in Oman" />
   <meta property="og:image" content="https://spirithubcafe.com/images/icon-512x512.png" />
   ```

3. **What they should see (for product pages):**
   ```html
   <title>Brazil Catuai Natural | Spirit Hub Cafe</title>
   <meta property="og:title" content="Brazil Catuai Natural | Spirit Hub Cafe" />
   <meta property="og:image" content="https://spirithubapi.sbc.om/images/products/brazil-catuai-natural.webp" />
   ```

## Testing the Current Implementation

Even though crawlers won't see dynamic tags, you can verify the frontend is working correctly:

### Test 1: Browser DevTools
1. Open product page: https://spirithubcafe.com/products/brazil-catuai-natural
2. Right-click → Inspect
3. Go to `<head>` section
4. Look for `<meta property="og:image">`
5. **Expected**: Should show product image URL from API
6. **Verify**: URL starts with `https://spirithubapi.sbc.om`

### Test 2: View Page Source
1. Open product page
2. Right-click → View Page Source
3. Search for `og:image`
4. **Expected**: Shows generic icon (static HTML)
5. **This is the problem** - crawlers see this, not the dynamic tags

### Test 3: React DevTools
1. Install React DevTools extension
2. Open product page
3. Find `<Seo>` component
4. Check props: `image`, `title`, `description`
5. **Expected**: All props correctly filled with product data

### Test 4: Console Verification
1. Open browser console on product page
2. Run this command:
   ```javascript
   console.log('OG Image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
   console.log('OG Title:', document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
   console.log('OG Description:', document.querySelector('meta[property="og:description"]')?.getAttribute('content'));
   ```
3. **Expected**: Should show product-specific values

## Testing Social Media Sharing (After Backend Implementation)

Once the backend implements SSR (see `SOCIAL_MEDIA_SHARING_BACKEND_REQUIREMENTS.md`), use these tools:

### 1. Facebook Sharing Debugger
**URL**: https://developers.facebook.com/tools/debug/

**Steps:**
1. Enter product URL
2. Click "Debug"
3. Check preview - should show product image and description
4. If not correct, click "Scrape Again" to refresh cache

**Expected Result:**
- Image: Product photo from API
- Title: Product name
- Description: Product description with tasting notes

### 2. Twitter Card Validator
**URL**: https://cards-dev.twitter.com/validator

**Steps:**
1. Enter product URL
2. Click "Preview card"
3. Check card displays correctly

**Expected Result:**
- Large image card
- Product name as title
- Short description visible

### 3. WhatsApp Preview Test
**Steps:**
1. Send product link to yourself or friend on WhatsApp
2. Wait for preview to generate (5-10 seconds)
3. Check thumbnail and text

**Expected Result:**
- Product image thumbnail
- Product name
- Short description

### 4. LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**Steps:**
1. Enter product URL
2. Click "Inspect"
3. View preview

**Expected Result:**
- Professional card with product image
- Title and description

### 5. Manual Crawler Simulation
Test what crawlers actually see:

```bash
# Facebook crawler
curl -A "facebookexternalhit/1.1" https://spirithubcafe.com/products/brazil-catuai-natural

# Twitter crawler
curl -A "Twitterbot/1.0" https://spirithubcafe.com/products/brazil-catuai-natural

# WhatsApp crawler
curl -A "WhatsApp/2.0" https://spirithubcafe.com/products/brazil-catuai-natural
```

**Expected**: Should return HTML with product-specific meta tags (after backend implementation)

## Common Issues and Solutions

### Issue 1: Old Preview Cached
**Symptom**: Sharing shows old product details or generic site info

**Solutions:**
- Facebook: Use Sharing Debugger and click "Scrape Again"
- Twitter: Wait 7 days for cache to expire (no manual refresh)
- WhatsApp: Clear chat, resend link after 24 hours
- LinkedIn: Use Post Inspector to force refresh

### Issue 2: Image Not Loading
**Symptom**: Text appears but no image

**Possible Causes:**
- ❌ Image URL is relative, not absolute
- ❌ Image is too small (< 200x200px)
- ❌ Image file is too large (> 8MB)
- ❌ Image server blocks social media bots
- ❌ CORS issues

**Verify:**
```bash
curl -I https://spirithubapi.sbc.om/images/products/product-name.webp
```

Should return `200 OK` and not redirect

### Issue 3: Wrong Product Showing
**Symptom**: Different product details appear when sharing

**Causes:**
- ❌ Cache from previous product page
- ❌ Dynamic routing issue
- ❌ Backend not detecting product slug correctly

**Fix:** Clear browser cache and test again

### Issue 4: Description Too Long
**Symptom**: Description gets truncated

**Platform Limits:**
- Facebook: ~300 characters
- Twitter: ~200 characters
- WhatsApp: ~150 characters
- LinkedIn: ~256 characters

**Solution:** Keep `ogDescription` concise (under 160 chars)

## Quick Verification Checklist

Before sharing on social media, verify:

- [ ] Product page loads correctly in browser
- [ ] Product image is visible on page
- [ ] Image URL in DevTools starts with `https://`
- [ ] Image file is accessible (test URL directly)
- [ ] Image is at least 1200x630 pixels
- [ ] Title and description are correct in DevTools
- [ ] Meta tags are present in browser's Inspector

After backend implementation, also verify:

- [ ] View Page Source shows product-specific meta tags
- [ ] cURL with crawler User-Agent returns product HTML
- [ ] Facebook Debugger shows correct preview
- [ ] Twitter Card Validator shows correct preview
- [ ] WhatsApp link preview works
- [ ] LinkedIn preview is correct

## Recommended Test Products

Use these products for testing (after backend is ready):

1. **Brazil Catuai Natural** - `/products/brazil-catuai-natural`
2. **Ethiopia Yirgacheffe** - `/products/ethiopia-yirgacheffe` (if exists)
3. **Colombia Supremo** - `/products/colombia-supremo` (if exists)

Test with different scenarios:
- ✅ Product with all data filled
- ✅ Product with minimal data
- ✅ Product with long description
- ✅ Product with multiple images
- ✅ Product that's out of stock

## Next Steps

1. **Frontend (Done)**: ✅ Enhanced meta tag generation
2. **Backend (Required)**: Implement SSR for product pages
3. **Testing**: Use this guide to verify implementation
4. **Monitoring**: Track sharing analytics after launch

## Support

If issues persist after backend implementation:

1. Check backend logs for crawler detection
2. Verify HTML generation for product pages
3. Test with multiple products
4. Clear all caches (browser, CDN, social media)
5. Wait 24-48 hours for DNS/cache propagation

---

**Last Updated**: November 19, 2025
**Status**: Frontend optimized, awaiting backend SSR implementation
