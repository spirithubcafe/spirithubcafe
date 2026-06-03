import fs from 'fs';
import path from 'path';

const SEO_HOSTS = {
  om: 'https://spirithubcafe.com',
  sa: 'https://spirithub.sa',
};

// API base URL
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.spirithubcafe.com/api';

// Cache for product data (valid for 5 minutes)
const productCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch product details from API (by ID or slug)
async function fetchProductDetails(identifier) {
  const cacheKey = `product_${identifier}`;
  const cached = productCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    let response;
    let result = null;
    
    // If identifier is a number, try by ID
    if (!isNaN(identifier)) {
      console.log(`Fetching product by ID: ${API_BASE_URL}/Products/${identifier}`);
      response = await fetch(`${API_BASE_URL}/Products/${identifier}`);
      if (response.ok) {
        result = await response.json();
      }
    }
    
    // If not found or identifier is a slug, try by slug endpoint
    if (!result) {
      console.log(`Fetching product by slug: ${API_BASE_URL}/Products/slug/${identifier}`);
      response = await fetch(`${API_BASE_URL}/Products/slug/${identifier}`);
      
      if (response.ok) {
        result = await response.json();
      }
    }
    
    if (!result || !result.success) {
      console.log(`Product not found: ${identifier}`);
      return null;
    }
    
    const data = result.data;
    console.log(`Product found:`, data.name);
    
    // Cache the result
    productCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }
}

function getProductIdentifierFromUrl(url) {
  const originalPath = (url || '/').split('?')[0].split('#')[0];
  let cleanUrl = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;

  if (cleanUrl === '/om' || cleanUrl.startsWith('/om/')) {
    cleanUrl = cleanUrl.slice(3) || '/';
  } else if (cleanUrl === '/sa' || cleanUrl.startsWith('/sa/')) {
    cleanUrl = cleanUrl.slice(3) || '/';
  }

  if (!cleanUrl.startsWith('/products/') || cleanUrl.length <= 10) {
    return null;
  }

  return cleanUrl.split('/products/')[1].split('/')[0] || null;
}

const serializeForInlineScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const GCC_COUNTRY_CODES = ['OM', 'SA', 'AE', 'KW', 'QA', 'BH'];

const buildOfferShippingDetails = () =>
  GCC_COUNTRY_CODES.map((countryCode) => ({
    '@type': 'OfferShippingDetails',
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: countryCode,
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 5,
        unitCode: 'DAY',
      },
    },
  }));

const buildOfferReturnPolicy = () => ({
  '@type': 'MerchantReturnPolicy',
  applicableCountry: GCC_COUNTRY_CODES,
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 30,
  returnMethod: 'https://schema.org/ReturnByMail',
  refundType: 'https://schema.org/FullRefund',
});

const buildStructuredDataTag = (data) =>
  `<script type="application/ld+json" data-generated="seo">${serializeForInlineScript(data)}</script>`;

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getApprovedProductReviews = (product) =>
  Array.isArray(product?.reviews)
    ? product.reviews.filter((review) => review?.isApproved === true)
    : [];

const toProductReviewSchema = (review) => {
  const rating = toFiniteNumber(review?.rating);
  const authorName = String(review?.customerName || '').trim();
  const reviewBody = String(review?.content || '').trim();

  if (!rating || rating < 1 || rating > 5 || !authorName || !reviewBody) {
    return null;
  }

  return {
    '@type': 'Review',
    author: { '@type': 'Person', name: authorName },
    datePublished: review.createdAt || undefined,
    name: String(review.title || '').trim() || undefined,
    reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
  };
};

const buildProductAggregateRating = (product, approvedReviews) => {
  const approvedRatings = approvedReviews
    .map((review) => toFiniteNumber(review?.rating))
    .filter((rating) => rating !== null && rating >= 1 && rating <= 5);

  if (approvedRatings.length > 0) {
    const ratingValue = approvedRatings.reduce((sum, rating) => sum + rating, 0) / approvedRatings.length;
    return {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount: approvedRatings.length,
    };
  }

  const ratingValue = toFiniteNumber(product?.averageRating);
  const reviewCount = toFiniteNumber(product?.reviewCount);
  if (ratingValue && ratingValue >= 1 && ratingValue <= 5 && reviewCount && reviewCount > 0) {
    return {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    };
  }

  return undefined;
};

// Helper function to generate meta tags based on route
async function getMetaTagsForRoute(url, baseUrl, preloadedProduct = null) {
  const resolvedBaseUrl = (baseUrl || process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://spirithubcafe.com')
    .toString()
    .replace(/\/+$/, '');
  
  // Clean URL (remove query params and hash)
  const originalPath = url.split('?')[0].split('#')[0];
  let cleanUrl = originalPath;
  if (!cleanUrl.startsWith('/')) cleanUrl = `/${cleanUrl}`;

  // Detect region from URL
  let region = '';
  if (cleanUrl === '/om' || cleanUrl.startsWith('/om/')) {
    region = 'om';
  } else if (cleanUrl === '/sa' || cleanUrl.startsWith('/sa/')) {
    region = 'sa';
  }

  // Normalize region prefixes for route matching (but keep originalPath for og:url)
  let normalizedPath = cleanUrl;
  if (region === 'om') {
    normalizedPath = normalizedPath.slice(3) || '/';
  } else if (region === 'sa') {
    normalizedPath = normalizedPath.slice(3) || '/';
  }
  
  // Default meta tags
  const regionName = region === 'sa' ? 'Saudi Arabia' : 'Oman';
  let title = region === 'sa'
    ? 'Specialty Coffee in Saudi Arabia | Spirit Hub Cafe'
    : 'Specialty Coffee in Oman & Saudi Arabia | Spirit Hub Cafe';
  let description = region === 'sa'
    ? 'Shop fresh specialty coffee from SpiritHub Roastery with roasted beans, filter coffee, and capsules available across Saudi Arabia.'
    : 'Shop fresh specialty coffee from SpiritHub Roastery. Explore roasted beans, filter coffee, and capsules with fast delivery across Oman and Saudi Arabia.';
  let image = `${resolvedBaseUrl}/images/icon-512x512.png`;
  let ogType = 'website';
  let productPrice = null;
  const productCurrency = region === 'sa' ? 'SAR' : 'OMR';
  let productAvailability = 'in stock';
  let productForStructuredData = null;

  if (normalizedPath === '/' || normalizedPath === '') {
    image = `${resolvedBaseUrl}/logo.png`;
  }

  // Customize based on route
  if (normalizedPath.startsWith('/products/') && normalizedPath.length > 10) {
    // Extract product identifier (can be ID or slug)
    const identifier = normalizedPath.split('/products/')[1].split('/')[0];
    
    // Fetch product details (works with both ID and slug)
    const product = preloadedProduct || await fetchProductDetails(identifier);
    
    if (product) {
      productForStructuredData = product;

      // Get product name
      const productName = product.name || 'Product';
      const regionSuffix = region ? ` | ${regionName}` : '';
      title = `${productName}${regionSuffix} | Spirit Hub Cafe`;
      
      // Get product description and strip HTML tags
      let productDesc = product.description || '';
      if (productDesc) {
        // Strip HTML tags
        productDesc = productDesc.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
        // Get first 160 characters
        description = productDesc.length > 160 ? 
          productDesc.substring(0, 157) + '...' : 
          productDesc;
      }
      
      // If no description, use tasting notes
      if (!description && product.tastingNotes) {
        description = `${productName} - ${product.tastingNotes}. Premium ${product.origin || 'specialty'} coffee from Spirit Hub Cafe in ${regionName}`;
      }
      
      // Fallback description with more details
      if (!description) {
        const details = [];
        if (product.origin) details.push(product.origin);
        if (product.roastLevel) details.push(product.roastLevel);
        const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        description = `Buy ${productName}${detailsStr} from Spirit Hub Cafe - Premium specialty coffee in ${regionName}`;
      }
      
      // Get product price for structured data
      const availablePrice = product.price || product.minPrice || product.basePrice;
      if (availablePrice) {
        productPrice = availablePrice;
      }
      
      // Check product availability
      if (product.inStock === false || product.stock === 0) {
        productAvailability = 'out of stock';
      }
      
      // Use product main image with better error handling
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Find main image or use first image
        const mainImage = product.images.find(img => img.isMain) || product.images[0];
        if (mainImage && mainImage.imagePath) {
          // API returns path starting with /uploads
          try {
            const apiOrigin = new URL(API_BASE_URL).origin;
            // Ensure proper URL format
            const imagePath = mainImage.imagePath.startsWith('/') ? mainImage.imagePath : `/${mainImage.imagePath}`;
            image = `${apiOrigin}${imagePath}`;
          } catch {
            // Fallback: if URL parsing fails, construct manually
            const imagePath = mainImage.imagePath.startsWith('/') ? mainImage.imagePath : `/${mainImage.imagePath}`;
            image = `https://api.spirithubcafe.com${imagePath}`;
          }
        }
      }
      
      ogType = 'product';
      console.log(`Generated meta for product: ${productName} (${region || 'default'})`);
      console.log(`Image: ${image}`);
      console.log(`Description: ${description.substring(0, 50)}...`);
      console.log(`Price: ${productPrice} ${productCurrency}`);
    } else {
      title = `Product Details${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
      description = `View our premium coffee products at Spirit Hub Cafe in ${regionName}`;
      ogType = 'product';
      console.log('Product not found, using default meta tags');
    }
  } else if (normalizedPath === '/products' || normalizedPath === '/products/') {
    title = `Our Products${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe | سبيريت هب`;
    description = `Browse our selection of specialty coffee beans, brewing equipment, and premium merchandise from Spirit Hub Cafe in ${regionName}`;
  } else if (normalizedPath === '/about' || normalizedPath === '/about/') {
    title = `About Us${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe | سبيريت هب`;
    description = `Learn about Spirit Hub Cafe - our story, mission, and passion for roasting the finest specialty coffee in ${regionName}`;
  } else if (normalizedPath === '/contact' || normalizedPath === '/contact/') {
    title = `Contact Us${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe | سبيريت هب`;
    description = `Get in touch with Spirit Hub Cafe in ${regionName === 'Saudi Arabia' ? 'Riyadh, Saudi Arabia' : 'Muscat, Oman'} - visit us, call us, or send us a message`;
  } else if (normalizedPath === '/favorites' || normalizedPath === '/favorites/') {
    title = `My Favorites${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
    description = `View your favorite products from Spirit Hub Cafe in ${regionName}`;
  } else if (normalizedPath === '/orders' || normalizedPath === '/orders/') {
    title = `My Orders${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
    description = `Track and manage your orders from Spirit Hub Cafe in ${regionName}`;
  } else if (normalizedPath === '/checkout' || normalizedPath === '/checkout/') {
    title = `Checkout${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
    description = `Complete your order from Spirit Hub Cafe - ${regionName}'s premier specialty coffee roastery`;
  } else if (normalizedPath === '/login' || normalizedPath === '/login/') {
    title = `Login${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
    description = 'Sign in to your Spirit Hub Cafe account';
  } else if (normalizedPath === '/register' || normalizedPath === '/register/') {
    title = `Create Account${region ? ` | ${regionName}` : ''} | Spirit Hub Cafe`;
    description = 'Join Spirit Hub Cafe community and enjoy exclusive benefits';
  }

  const guessMimeType = (urlStr) => {
    const u = (urlStr || '').toLowerCase();
    if (u.endsWith('.png')) return 'image/png';
    if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'image/jpeg';
    if (u.endsWith('.gif')) return 'image/gif';
    if (u.endsWith('.webp')) return 'image/webp';
    if (u.endsWith('.svg')) return 'image/svg+xml';
    return 'image/jpeg';
  };

  // WhatsApp doesn't support WebP - convert to JPEG using wsrv.nl proxy
  const isWebp = (image || '').toLowerCase().endsWith('.webp');
  const ogImage = isWebp && image 
    ? `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&q=90` 
    : image;
  const ogImageType = isWebp ? 'image/jpeg' : guessMimeType(image);

  // Use converted image for og:image (1080x1080)
  const ogImageTags = ogImage ? `
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:width" content="1080" />
    <meta property="og:image:height" content="1080" />` : '';

  const canonicalPath = normalizedPath || '/';
  const omUrl = canonicalPath === '/' ? `${SEO_HOSTS.om}/om` : `${SEO_HOSTS.om}/om${canonicalPath}`;
  const saUrl = canonicalPath === '/' ? SEO_HOSTS.sa : `${SEO_HOSTS.sa}${canonicalPath}`;
  const canonicalUrl = region === 'sa' ? saUrl : omUrl;

  // Build product-specific meta tags if it's a product page
  let productMetaTags = '';
  if (ogType === 'product' && productPrice) {
    productMetaTags = `
    <meta property="product:price:amount" content="${productPrice}" />
    <meta property="product:price:currency" content="${productCurrency}" />
    <meta property="product:availability" content="${productAvailability}" />
    <meta property="og:availability" content="${productAvailability}" />`;
  }

  const approvedReviews = getApprovedProductReviews(productForStructuredData);
  const productReviews = approvedReviews
    .map(toProductReviewSchema)
    .filter(Boolean)
    .slice(0, 5);
  const aggregateRating = buildProductAggregateRating(productForStructuredData, approvedReviews);

  const productStructuredDataTag = productForStructuredData && productPrice
    ? buildStructuredDataTag({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productForStructuredData.name || 'Product',
        description,
        sku: productForStructuredData.sku || undefined,
        image,
        brand: { '@type': 'Brand', name: 'Spirit Hub Cafe' },
        url: canonicalUrl,
        aggregateRating,
        review: productReviews.length ? productReviews : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: productCurrency,
          price: String(productPrice),
          availability: productAvailability === 'out of stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: canonicalUrl,
          seller: {
            '@type': 'Organization',
            name: 'Spirit Hub Cafe',
            url: resolvedBaseUrl,
          },
          shippingDetails: buildOfferShippingDetails(),
          hasMerchantReturnPolicy: buildOfferReturnPolicy(),
        },
      })
    : '';

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="en-OM" href="${omUrl}" />
    <link rel="alternate" hreflang="ar-OM" href="${omUrl}" />
    <link rel="alternate" hreflang="en-SA" href="${saUrl}" />
    <link rel="alternate" hreflang="ar-SA" href="${saUrl}" />
    <link rel="alternate" hreflang="x-default" href="${omUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:locale" content="en-OM" />
    <meta property="og:locale:alternate" content="ar-OM" />
    ${ogImageTags}
    <meta property="og:site_name" content="Spirit Hub Cafe" />
    ${productMetaTags}
    ${productStructuredDataTag}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:site" content="@spirithubcafe" />
  `;
}

export default async function handler(req, res) {
  try {
    const url = req.url || '/';
    const urlPathOnly = url.split('?')[0].split('#')[0];
    const productIdentifier = getProductIdentifierFromUrl(urlPathOnly);
    const ssrProduct = productIdentifier ? await fetchProductDetails(productIdentifier) : null;

    const forwardedProto = (req.headers?.['x-forwarded-proto'] || '').toString().split(',')[0].trim();
    const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toString().split(',')[0].trim();
    const host = forwardedHost || req.headers?.host;
    const proto = forwardedProto || 'https';
    const requestBaseUrl = host ? `${proto}://${host}`.replace(/\/+$/, '') : undefined;
    
    // For static assets, try to serve from dist folder
    if (urlPathOnly.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|mp4|webm|ogg|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$/)) {
      try {
        // IMPORTANT: `url` starts with `/` (absolute path). Using `path.join(dist, url)`
        // would ignore `dist` on Node.js. Normalize to a safe relative path.
        const distDir = path.resolve(process.cwd(), 'dist');
        const relativeUrlPath = decodeURIComponent(urlPathOnly).replace(/^\/+/, '');
        const resolvedPath = path.resolve(distDir, relativeUrlPath);

        // Prevent path traversal outside dist
        if (!resolvedPath.startsWith(distDir + path.sep) && resolvedPath !== distDir) {
          return res.status(403).end();
        }

        if (fs.existsSync(resolvedPath)) {
          const content = fs.readFileSync(resolvedPath);
          const ext = path.extname(urlPathOnly);
          const contentTypes = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.ico': 'image/x-icon',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.webmanifest': 'application/manifest+json'
          };
          res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.status(200).send(content);
        }
      } catch (err) {
        console.error('Static file error:', err);
      }
      return res.status(404).end();
    }
    
    // Read the built index.html
    const indexPath = path.join(process.cwd(), 'dist/index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    // Get meta tags based on route (async)
    const metaTags = await getMetaTagsForRoute(url, requestBaseUrl, ssrProduct);
    const ssrBootstrapScript = ssrProduct
      ? `<script>window.__SSR_PRODUCT__=${serializeForInlineScript(ssrProduct)};window.__SSR_PRODUCT_ID__=${serializeForInlineScript(productIdentifier)};</script>`
      : '';
    
    // Replace the meta tags placeholder (only in head)
    if (html.includes('<!--app-head-->')) {
      html = html.replace('<!--app-head-->', `${ssrBootstrapScript}${metaTags}`);
    } else {
      // If placeholder not found, inject before </head>
      html = html.replace('</head>', `${ssrBootstrapScript}${metaTags}\n  </head>`);
    }

    let responseStatus = 200;

    // ── Attempt SSR (inject rendered HTML into <div id="root">) ────
    // Wrapped in try/catch so a render failure never breaks the site.
    try {
      const ssrBundlePath = path.join(process.cwd(), 'dist/server/entry-server.js');
      if (fs.existsSync(ssrBundlePath)) {
        const { render } = await import(ssrBundlePath);
        if (typeof render === 'function') {
          const acceptLanguage = (req.headers?.['accept-language'] || '').toString().split(',')[0].trim().toLowerCase();
          const requestLanguage = acceptLanguage.startsWith('ar') ? 'ar' : 'en';
          const previousProduct = globalThis.__SSR_PRODUCT__;
          const previousProductId = globalThis.__SSR_PRODUCT_ID__;

          if (ssrProduct) {
            globalThis.__SSR_PRODUCT__ = ssrProduct;
            globalThis.__SSR_PRODUCT_ID__ = productIdentifier;
          } else {
            delete globalThis.__SSR_PRODUCT__;
            delete globalThis.__SSR_PRODUCT_ID__;
          }

          const { html: appHtml, error } = await render(url, requestLanguage);

          if (typeof previousProduct === 'undefined') {
            delete globalThis.__SSR_PRODUCT__;
          } else {
            globalThis.__SSR_PRODUCT__ = previousProduct;
          }

          if (typeof previousProductId === 'undefined') {
            delete globalThis.__SSR_PRODUCT_ID__;
          } else {
            globalThis.__SSR_PRODUCT_ID__ = previousProductId;
          }

          if (appHtml && !error) {
            if (appHtml.includes('data-not-found-page="true"')) {
              responseStatus = 404;
            }
            html = html.replace('<div id="root"></div>', `<div id="root" data-ssr="true">${appHtml}</div>`);
          }
        }
      }
    } catch (ssrError) {
      // SSR failed – serve the SPA shell as before
      console.warn('[SSR] render skipped:', ssrError?.message || ssrError);
    }
    
    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    
    // Send response
    res.status(responseStatus).send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    console.error('Error details:', error.message);
    console.error('Working directory:', process.cwd());
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}
