import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API base URL
const API_BASE_URL = process.env.VITE_API_URL || 'https://spirithubapi.sbc.om/api';

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
    let data = null;
    
    // If identifier is a number, try by ID
    if (!isNaN(identifier)) {
      console.log(`Fetching product by ID: ${API_BASE_URL}/products/${identifier}`);
      response = await fetch(`${API_BASE_URL}/products/${identifier}`);
      if (response.ok) {
        data = await response.json();
      }
    }
    
    // If not found or identifier is a slug, try fetching all products and find by slug
    if (!data) {
      console.log(`Fetching product by slug from: ${API_BASE_URL}/products`);
      response = await fetch(`${API_BASE_URL}/products`);
      
      if (response.ok) {
        const products = await response.json();
        // Find product by slug
        if (Array.isArray(products)) {
          data = products.find(p => p.slug === identifier);
        }
      }
    }
    
    if (!data) {
      console.log(`Product not found: ${identifier}`);
      return null;
    }
    
    console.log(`Product found:`, data.name || data.title);
    
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

// Helper function to generate meta tags based on route
async function getMetaTagsForRoute(url) {
  const baseUrl = 'https://spirithubcafe.com';
  
  // Clean URL (remove query params and hash)
  const cleanUrl = url.split('?')[0].split('#')[0];
  
  // Default meta tags
  let title = 'Spirit Hub Cafe | Specialty Coffee in Oman | سبيريت هب';
  let description = 'Spirit Hub Cafe roasts specialty coffee in Oman. Discover premium beans, artisanal brews, and a vibrant community experience at سبيريت هب.';
  let image = `${baseUrl}/images/icon-512x512.png`;
  let ogType = 'website';

  // Customize based on route
  if (cleanUrl.startsWith('/products/') && cleanUrl.length > 10) {
    // Extract product identifier (can be ID or slug)
    const identifier = cleanUrl.split('/products/')[1].split('/')[0];
    
    // Fetch product details (works with both ID and slug)
    const product = await fetchProductDetails(identifier);
    
    if (product) {
      // Get product name (try different field names)
      const productName = product.name || product.title || product.productName || 'Product';
      title = `${productName} | Spirit Hub Cafe`;
      
      // Get product description (try different field names and strip HTML)
      let productDesc = product.description || product.desc || product.shortDescription || '';
      if (productDesc) {
        // Strip HTML tags if present
        productDesc = productDesc.replace(/<[^>]*>/g, '').trim();
        description = productDesc.length > 160 ? 
          productDesc.substring(0, 157) + '...' : 
          productDesc;
      } else {
        description = `Buy ${productName} from Spirit Hub Cafe - Premium specialty coffee in Oman`;
      }
      
      // Use product image if available (try different field names)
      const productImages = product.images || product.image || product.mainImage || product.thumbnail;
      if (productImages) {
        let imageUrl = '';
        
        if (Array.isArray(productImages) && productImages.length > 0) {
          imageUrl = productImages[0];
        } else if (typeof productImages === 'string') {
          imageUrl = productImages;
        }
        
        if (imageUrl) {
          // Handle different image URL formats
          if (imageUrl.startsWith('http')) {
            image = imageUrl;
          } else if (imageUrl.startsWith('/')) {
            image = `${API_BASE_URL.replace('/api', '')}${imageUrl}`;
          } else {
            image = `${API_BASE_URL.replace('/api', '')}/uploads/${imageUrl}`;
          }
        }
      }
      
      ogType = 'product';
      console.log(`Generated meta for product: ${productName}, image: ${image}`);
    } else {
      title = `Product Details | Spirit Hub Cafe`;
      description = `View our premium coffee products at Spirit Hub Cafe`;
      ogType = 'product';
      console.log('Product not found, using default meta tags');
    }
  } else if (cleanUrl === '/products' || cleanUrl === '/products/') {
    title = 'Our Products | Spirit Hub Cafe | سبيريت هب';
    description = 'Browse our selection of specialty coffee beans, brewing equipment, and premium merchandise from Spirit Hub Cafe';
  } else if (cleanUrl === '/about' || cleanUrl === '/about/') {
    title = 'About Us | Spirit Hub Cafe | سبيريت هب';
    description = 'Learn about Spirit Hub Cafe - our story, mission, and passion for roasting the finest specialty coffee in Oman';
  } else if (cleanUrl === '/contact' || cleanUrl === '/contact/') {
    title = 'Contact Us | Spirit Hub Cafe | سبيريت هب';
    description = 'Get in touch with Spirit Hub Cafe in Muscat, Oman - visit us, call us, or send us a message';
  } else if (cleanUrl === '/favorites' || cleanUrl === '/favorites/') {
    title = 'My Favorites | Spirit Hub Cafe';
    description = 'View your favorite products from Spirit Hub Cafe';
  } else if (cleanUrl === '/orders' || cleanUrl === '/orders/') {
    title = 'My Orders | Spirit Hub Cafe';
    description = 'Track and manage your orders from Spirit Hub Cafe';
  } else if (cleanUrl === '/checkout' || cleanUrl === '/checkout/') {
    title = 'Checkout | Spirit Hub Cafe';
    description = 'Complete your order from Spirit Hub Cafe - Oman\'s premier specialty coffee roastery';
  } else if (cleanUrl === '/login' || cleanUrl === '/login/') {
    title = 'Login | Spirit Hub Cafe';
    description = 'Sign in to your Spirit Hub Cafe account';
  } else if (cleanUrl === '/register' || cleanUrl === '/register/') {
    title = 'Create Account | Spirit Hub Cafe';
    description = 'Join Spirit Hub Cafe community and enjoy exclusive benefits';
  }

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${baseUrl}${cleanUrl}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Spirit Hub Cafe" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  `;
}

export default async function handler(req, res) {
  try {
    const url = req.url || '/';
    
    // For static assets, try to serve from dist folder
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$/)) {
      try {
        const filePath = path.join(process.cwd(), 'dist', url);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          const ext = path.extname(url);
          const contentTypes = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
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
    const metaTags = await getMetaTagsForRoute(url);
    
    // Replace the meta tags placeholder (only in head)
    if (html.includes('<!--app-head-->')) {
      html = html.replace('<!--app-head-->', metaTags);
    } else {
      // If placeholder not found, inject before </head>
      html = html.replace('</head>', `${metaTags}\n  </head>`);
    }
    
    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    
    // Send response
    res.status(200).send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    console.error('Error details:', error.message);
    console.error('Working directory:', process.cwd());
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}
