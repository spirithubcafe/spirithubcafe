import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
  : '';

// Create http server
const app = express();

// Add Vite or respective production middlewares
let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  });
  app.use(vite.middlewares);
} else {
  app.use(compression());
  app.use(base, express.static(path.resolve(__dirname, 'dist/client'), { index: false }));
}

// Serve HTML - Catch all routes with meta tag injection
app.use(async (req, res, next) => {
  try {
    const url = req.originalUrl.replace(base, '');

    let template;
    if (!isProduction) {
      // Always read fresh template in development
      template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
    } else {
      template = templateHtml;
    }

    // Get meta tags based on route
    const metaTags = getMetaTagsForRoute(url);
    
    // Replace the meta tags in the template (no SSR, just meta injection)
    let html = template.replace('<!--app-head-->', metaTags);

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Helper function to generate meta tags based on route
function getMetaTagsForRoute(url) {
  const baseUrl = 'https://spirithubcafe.com';
  
  // Clean URL (remove query params and hash)
  let cleanUrl = url.split('?')[0].split('#')[0];
  
  // Extract region from URL and normalize path
  let region = 'om'; // default
  if (cleanUrl.startsWith('/om/') || cleanUrl === '/om') {
    region = 'om';
    cleanUrl = cleanUrl.substring(3) || '/';
  } else if (cleanUrl.startsWith('/sa/') || cleanUrl === '/sa') {
    region = 'sa';
    cleanUrl = cleanUrl.substring(3) || '/';
  }
  
  // Default meta tags
  let title = 'Spirit Hub Cafe | Specialty Coffee in Oman | سبيريت هب';
  let description = 'Spirit Hub Cafe roasts specialty coffee in Oman. Discover premium beans, artisanal brews, and a vibrant community experience at سبيريت هب.';
  let image = `${baseUrl}/images/icon-512x512.png`;
  let ogType = 'website';
  
  // Update titles based on region
  if (region === 'sa') {
    title = 'Spirit Hub Cafe | Specialty Coffee in Saudi Arabia | سبيريت هب';
    description = 'Spirit Hub Cafe roasts specialty coffee in Saudi Arabia. Discover premium beans, artisanal brews, and a vibrant community experience at سبيريت هب.';
  }

  // Customize based on route
  if (cleanUrl.startsWith('/products/') && cleanUrl.length > 10) {
    const productId = cleanUrl.split('/products/')[1];
    title = `Product Details | Spirit Hub Cafe`;
    description = `View our premium coffee products at Spirit Hub Cafe`;
    ogType = 'product';
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

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
