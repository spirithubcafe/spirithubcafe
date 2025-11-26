# Server-Side Meta Tag Injection Guide

## Changes Made

To enable **Link Preview** on social networks (such as WhatsApp, Telegram, Facebook, Twitter), a Meta Tag Injection system has been implemented.

### Added Files:
1. **`server.js`** - Express server to serve the application
2. **`src/entry-server.tsx`** - Entry point for SSR (currently not in use)

### Modified Files:
1. **`package.json`** - New scripts:
   - `npm run dev` - Run server with meta injection
   - `npm run dev:spa` - Run regular Vite without server
   - `npm run serve` - Run server in production mode

2. **`index.html`** - Added `<!--app-head-->` placeholder for injection

3. **`src/main.tsx`** - Hydration support for SSR

4. **`src/App.tsx`** - Removed BrowserRouter (moved to main.tsx)

5. **`vite.config.ts`** - SSR configuration

## Usage

### Development:
```bash
npm run dev
```
Server runs on `http://localhost:5173`.

### Production Build:
```bash
npm run build
npm run serve
```

## How Meta Injection Works

The Express server in `server.js` for each request:
1. Checks the URL
2. Generates appropriate meta tags based on the route
3. Injects them into the HTML template
4. Sends to the client

### Supported Routes:
- `/` - Home page
- `/products` - Product list
- `/products/:id` - Product details
- `/about` - About us
- `/contact` - Contact us
- `/favorites` - Favorites
- `/orders` - Orders
- `/checkout` - Checkout
- `/login` - Login
- `/register` - Register

## Adding New Routes

To add custom meta tags for a new route, edit the `server.js` file:

```javascript
function getMetaTagsForRoute(url) {
  // ...
  else if (cleanUrl === '/your-route' || cleanUrl === '/your-route/') {
    title = 'Your Page Title | Spirit Hub Cafe';
    description = 'Your page description';
  }
  // ...
}
```

## Testing Link Preview

To test link preview:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

Or with curl:
```bash
curl http://localhost:5173/products | grep -E '(<title>|og:)'
```

## Benefits

✅ Link preview on all social networks  
✅ Better SEO with dynamic meta tags  
✅ No need for full SSR (faster and simpler)  
✅ Compatible with PWA and Service Worker  
✅ Better performance compared to full SSR  

## Important Notes

- In development, Vite middleware supports HMR
- In production, static files are served from the `dist/client` folder
- For API calls, use `/api/*` to avoid routing conflicts

## Deployment

For deployment on different services:

### Vercel (Recommended):

The project is configured to work with Vercel out of the box:

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel --prod
```

Or simply connect your GitHub repository to Vercel dashboard and it will auto-deploy.

**Files for Vercel:**
- `vercel.json` - Configuration for routing and builds
- `api/ssr.js` - Serverless function for meta tag injection
- `.vercelignore` - Files to ignore during deployment

### Netlify:
Similar to Vercel, you can use Netlify Functions. Create `netlify.toml` and adapt the serverless function.

### VPS / Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5173
CMD ["npm", "run", "serve"]
```

### DigitalOcean / AWS:
Run the `server.js` file with PM2 or forever:
```bash
pm2 start server.js --name spirithub
```
