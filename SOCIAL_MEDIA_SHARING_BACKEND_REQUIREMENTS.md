# Social Media Sharing - Backend Requirements

## Problem Overview

Social media crawlers (Facebook, Twitter, WhatsApp, LinkedIn, etc.) **cannot execute JavaScript**. This means they can't see dynamically generated Open Graph meta tags in React Single Page Applications (SPAs).

When someone shares a product link like:
```
https://spirithubcafe.com/products/brazil-catuai-natural
```

The crawler only sees the static HTML from `index.html`, which contains generic site information, not specific product details.

## Current Frontend Implementation

✅ **What's Already Done:**
- React component generates Open Graph tags dynamically
- Product images, descriptions, and titles are correctly formatted
- Meta tags are updated on every page change
- Preconnect to API domain for faster loading

❌ **What Doesn't Work for Crawlers:**
- Dynamic meta tags only appear after JavaScript execution
- Crawlers fetch HTML and immediately parse it (no JS execution)
- Result: Generic "Spirit Hub Cafe" appears instead of product details

## Backend Solution Required

You need to implement **Server-Side Rendering (SSR) or Dynamic HTML Generation** for product pages. Here are the recommended approaches:

### Option 1: SSR Endpoint (Recommended)

Create a middleware or endpoint that:

1. **Detects crawler requests** by User-Agent:
   ```csharp
   // C# Example
   var userAgent = Request.Headers["User-Agent"].ToString().ToLower();
   var isCrawler = userAgent.Contains("facebookexternalhit") || 
                   userAgent.Contains("twitterbot") ||
                   userAgent.Contains("whatsapp") ||
                   userAgent.Contains("linkedinbot");
   ```

2. **Generates pre-rendered HTML** with product meta tags:
   ```csharp
   public async Task<IActionResult> GetProductPage(string slug)
   {
       var userAgent = Request.Headers["User-Agent"].ToString().ToLower();
       var isCrawler = IsCrawler(userAgent);
       
       if (isCrawler)
       {
           // Fetch product data
           var product = await _productService.GetBySlugAsync(slug);
           
           // Generate HTML with meta tags
           var html = GenerateProductHtml(product);
           return Content(html, "text/html");
       }
       
       // For regular users, serve the SPA
       return PhysicalFile(Path.Combine(_webRoot, "index.html"), "text/html");
   }
   ```

3. **Required Meta Tags in HTML:**
   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       
       <!-- Primary Meta Tags -->
       <title>{productName} | Spirit Hub Cafe</title>
       <meta name="title" content="{productName} | Spirit Hub Cafe" />
       <meta name="description" content="{productDescription}" />
       
       <!-- Open Graph / Facebook -->
       <meta property="og:type" content="product" />
       <meta property="og:url" content="https://spirithubcafe.com/products/{slug}" />
       <meta property="og:title" content="{productName} | Spirit Hub Cafe" />
       <meta property="og:description" content="{productDescription}" />
       <meta property="og:image" content="https://spirithubapi.sbc.om{productImagePath}" />
       <meta property="og:image:secure_url" content="https://spirithubapi.sbc.om{productImagePath}" />
       <meta property="og:image:width" content="1200" />
       <meta property="og:image:height" content="630" />
       <meta property="og:image:alt" content="{productName}" />
       <meta property="og:site_name" content="Spirit Hub Cafe" />
       <meta property="og:locale" content="en_OM" />
       
       <!-- Product-specific OG tags -->
       <meta property="product:price:amount" content="{price}" />
       <meta property="product:price:currency" content="OMR" />
       <meta property="product:availability" content="{isActive ? 'in stock' : 'out of stock'}" />
       
       <!-- Twitter -->
       <meta name="twitter:card" content="summary_large_image" />
       <meta name="twitter:url" content="https://spirithubcafe.com/products/{slug}" />
       <meta name="twitter:title" content="{productName} | Spirit Hub Cafe" />
       <meta name="twitter:description" content="{productDescription}" />
       <meta name="twitter:image" content="https://spirithubapi.sbc.om{productImagePath}" />
       <meta name="twitter:image:alt" content="{productName}" />
       
       <!-- Rest of the head section from index.html -->
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

### Option 2: Static HTML Generation

Generate static HTML files for each product during build/deployment:

```bash
# Generate HTML files
/products/brazil-catuai-natural.html
/products/ethiopia-yirgacheffe.html
/products/colombia-supremo.html
```

Each file contains pre-rendered meta tags. Configure your server to:
1. Serve `.html` file if it exists
2. Fall back to SPA's `index.html` for dynamic routes

### Option 3: Serverless Function (Edge Computing)

Use Cloudflare Workers, Vercel Edge Functions, or AWS Lambda@Edge:

```javascript
// Cloudflare Worker Example
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const isCrawler = /facebookexternalhit|twitterbot|whatsapp|linkedinbot/i.test(userAgent);
    
    if (isCrawler && url.pathname.startsWith('/products/')) {
      const slug = url.pathname.split('/').pop();
      
      // Fetch product data from API
      const response = await fetch(`https://spirithubapi.sbc.om/api/Products/slug/${slug}`);
      const product = await response.json();
      
      // Generate HTML with meta tags
      const html = generateProductHtml(product);
      return new Response(html, {
        headers: { 'content-type': 'text/html' },
      });
    }
    
    // Serve regular SPA
    return env.ASSETS.fetch(request);
  }
};
```

## Backend API Requirements

The backend should provide a dedicated endpoint for fetching product metadata:

```
GET /api/Products/meta/{slug}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Brazil Catuai Natural",
    "nameAr": "البرازيل كاتواي طبيعي",
    "slug": "brazil-catuai-natural",
    "description": "A sweet and chocolatey coffee from Brazil...",
    "descriptionAr": "قهوة حلوة وبنكهة الشوكولاتة من البرازيل...",
    "metaTitle": "Brazil Catuai Natural | Specialty Coffee",
    "metaDescription": "Buy Brazil Catuai Natural from Spirit Hub Cafe - Fresh roasted specialty coffee in Muscat, Oman",
    "metaKeywords": "brazil coffee, catuai, natural process, specialty coffee",
    "price": 12.500,
    "currency": "OMR",
    "isActive": true,
    "imagePath": "/images/products/brazil-catuai-natural.webp",
    "imageAlt": "Brazil Catuai Natural coffee beans",
    "tastingNotes": "Chocolate, Caramel, Nuts",
    "roastLevel": "Medium",
    "category": {
      "name": "Single Origin Coffee"
    }
  }
}
```

## Implementation Steps

### Backend Team

1. **Create Product Meta Endpoint**
   - Endpoint: `GET /api/Products/meta/{slug}`
   - Returns product data optimized for SEO
   - Include all necessary fields for Open Graph tags

2. **Implement Crawler Detection Middleware**
   - Detect crawler User-Agents
   - Route to SSR handler when crawler detected
   - Serve regular SPA for human users

3. **Generate Dynamic HTML**
   - Create HTML template with product meta tags
   - Replace placeholders with actual product data
   - Ensure image URLs are absolute (include domain)

4. **Configure Routing**
   - Routes like `/products/{slug}` should:
     - Return pre-rendered HTML for crawlers
     - Return SPA's `index.html` for regular users

### Testing

Use these tools to verify implementation:

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Enter product URL
   - Check if correct image and description appear

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Test product URL
   - Verify card preview shows product details

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/
   - Check product URL
   - Confirm proper preview rendering

4. **WhatsApp Preview**
   - Send product link to yourself on WhatsApp
   - Check if thumbnail and description appear

5. **Manual cURL Test**
   ```bash
   curl -A "facebookexternalhit/1.1" https://spirithubcafe.com/products/brazil-catuai-natural
   ```
   - Should return HTML with product-specific meta tags

## Important Notes

### Image URLs
- ✅ **Must be absolute URLs**: `https://spirithubapi.sbc.om/images/products/product.webp`
- ❌ **Not relative paths**: `/images/products/product.webp`

### Image Requirements
- **Minimum size**: 1200x630 pixels (Facebook recommendation)
- **Aspect ratio**: 1.91:1 (optimal for most platforms)
- **Format**: JPEG, PNG, or WebP
- **File size**: Under 8 MB

### Cache Considerations
- Social media platforms cache meta tags for 7-30 days
- After fixing, use debug tools to force refresh cache
- Facebook: Click "Scrape Again" in Sharing Debugger
- Twitter: No manual refresh, takes ~7 days

## Alternative: Quick Win Solution

If full SSR is not immediately feasible, implement this **temporary workaround**:

### Pre-render Critical Pages
Use a pre-rendering service or tool:

1. **Prerender.io** (Paid service)
   - Automatically detects crawlers
   - Serves pre-rendered pages
   - Minimal backend changes

2. **React Snap** (Free, requires build step)
   ```bash
   npm install --save-dev react-snap
   ```
   
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "postbuild": "react-snap"
     }
   }
   ```

3. **Puppeteer Pre-rendering** (Custom solution)
   - Use Puppeteer to generate static HTML
   - Upload to CDN
   - Configure server to serve pre-rendered pages to crawlers

## Summary

**Current Status:**
- ✅ Frontend correctly generates meta tags
- ✅ Product data structure supports SEO
- ❌ Crawlers can't see dynamic meta tags

**Required:**
- Backend SSR for product pages
- Crawler detection and routing
- Pre-rendered HTML with product meta tags

**Priority:**
- High - Social sharing is essential for marketing
- Affects: Facebook, Twitter, WhatsApp, LinkedIn, Pinterest

**Estimated Effort:**
- Backend: 2-3 days (with SSR middleware)
- Testing: 1 day (all platforms)
- Total: 3-4 days

## Questions?

Contact the frontend team for:
- Meta tag format specifications
- Image URL patterns
- Product data structure
- Testing assistance

---

**Last Updated**: November 19, 2025
**Frontend Version**: React 18 + Vite
**Backend Framework**: ASP.NET Core (assumed)
