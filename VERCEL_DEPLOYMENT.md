# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/spirithubcafe/spirithubcafe)

## Manual Deployment

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to your account:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration
5. Click "Deploy"

## Configuration Files

The project includes the following Vercel-specific files:

- **`vercel.json`** - Routing and build configuration
- **`api/ssr.js`** - Serverless function for meta tag injection
- **`.vercelignore`** - Files excluded from deployment

## How It Works

1. Static files (JS, CSS, images) are served from `/dist`
2. All page requests are routed to `/api/ssr` serverless function
3. The function reads `index.html` and injects dynamic meta tags
4. HTML is returned with proper Open Graph and Twitter Card tags

## Environment Variables

If you need environment variables, add them in Vercel Dashboard:
1. Go to Project Settings
2. Select "Environment Variables"
3. Add your variables (e.g., `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`)

## Build Settings

Vercel will automatically use these settings from `vercel.json`:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Testing Locally

To test Vercel functions locally:

```bash
npm i -g vercel
vercel dev
```

This will start a local development server that mimics Vercel's environment.

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Domain will be auto-configured with SSL

## Monitoring

- View deployment logs in Vercel Dashboard
- Check function invocations and errors
- Monitor performance metrics

## Troubleshooting

### Build fails:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 404 errors:
- Check `vercel.json` routes configuration
- Ensure `dist` folder is built correctly
- Verify static files are in the right location

### Meta tags not updating:
- Clear Vercel cache: redeploy
- Test with curl: `curl https://yourdomain.com/products`
- Check `/api/ssr.js` function logs

## Advanced Configuration

For more control, you can modify `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    }
  ]
}
```

## Support

For issues related to:
- **Vercel platform**: [Vercel Support](https://vercel.com/support)
- **This project**: Open an issue on GitHub
