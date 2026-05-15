import path from "path"
import fs from "fs/promises"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig, type ViteDevServer } from "vite"
import type { IncomingMessage, ServerResponse } from "http"

const seoWriterPlugin = () => ({
  name: "seo-writer",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
      if (!req.url) {
        return next()
      }

      const requestUrl = new URL(req.url, "http://localhost")
      
      // Serve static SEO files directly
      const staticFiles = ['/sitemap.xml', '/robots.txt', '/products-feed.xml']
      if (staticFiles.includes(requestUrl.pathname)) {
        try {
          const publicDir = path.resolve(__dirname, "public")
          const filePath = path.join(publicDir, requestUrl.pathname)
          const content = await fs.readFile(filePath, "utf8")
          
          // Set appropriate content type
          const contentType = requestUrl.pathname.endsWith('.xml') 
            ? 'application/xml; charset=utf-8' 
            : 'text/plain; charset=utf-8'
          
          res.statusCode = 200
          res.setHeader("Content-Type", contentType)
          res.setHeader("Cache-Control", "public, max-age=3600")
          res.end(content)
          return
        } catch (error) {
          console.error(`Error serving ${requestUrl.pathname}:`, error)
          res.statusCode = 404
          res.setHeader("Content-Type", "text/plain")
          res.end("File not found")
          return
        }
      }

      // Handle SEO save endpoint
      if (requestUrl.pathname !== "/__seo/save-file" || req.method !== "POST") {
        return next()
      }

      let body = ""
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString()
      })

      req.on("end", async () => {
        try {
          const payload = JSON.parse(body || "{}")
          const fileName = payload.fileName
          const contents = payload.contents

          if (!fileName || typeof contents !== "string") {
            res.statusCode = 400
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ success: false, message: "Invalid payload." }))
            return
          }

          const publicDir = path.resolve(__dirname, "public")
          const targetPath = path.join(publicDir, fileName)

          await fs.rm(targetPath, { force: true })
          await fs.writeFile(targetPath, contents, "utf8")

          res.statusCode = 200
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ success: true, path: targetPath }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ success: false, message: (error as Error).message }))
        }
      })
    })
  }
})

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    seoWriterPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: 'public',
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        // Only apply manualChunks for client builds; SSR externalizes these
        ...(!isSsrBuild && {
          onlyExplicitManualChunks: true,
          manualChunks(id: string) {
            if (id.includes('/node_modules/')) {
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/scheduler/') ||
                id.includes('/react-router/') ||
                id.includes('/react-router-dom/')
              ) {
                return 'react-vendor';
              }

              if (
                id.includes('/framer-motion/') ||
                id.includes('/motion/')
              ) {
                return 'motion-vendor';
              }

              if (id.includes('/lucide-react/')) {
                return 'icons-vendor';
              }

              if (
                id.includes('/i18next/') ||
                id.includes('/react-i18next/') ||
                id.includes('/i18next-browser-languagedetector/')
              ) {
                return 'i18n-vendor';
              }

              if (id.includes('/@radix-ui/')) {
                return 'radix-vendor';
              }
            }

            // Keep admin/reporting page code out of the storefront critical path.
            // Only place the matched route modules themselves into the admin chunk.
            // Shared dependencies stay in their natural chunks so the homepage does
            // not inherit an unnecessary dependency on the admin bundle.
            if (
              id.includes('/src/components/admin/') ||
              id.includes('/src/pages/CategoryAddPage') ||
              id.includes('/src/pages/CategoryEditPage') ||
              id.includes('/src/pages/ProductAddPage') ||
              id.includes('/src/pages/ProductEditPage') ||
              id.includes('/src/pages/ProductAttributesPage') ||
              id.includes('/src/pages/InvoicePage') ||
              id.includes('/src/pages/WholesaleDashboardPage') ||
              id.includes('/src/pages/WholesaleOrdersPage') ||
              id.includes('/src/pages/WholesaleOrderDetailsPage')
            ) {
              return 'admin';
            }

            return undefined;
          }
        })
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    // Copy static files
    copyPublicDir: true,
    // SSR manifest for production
    ssrManifest: true
  },
  ssr: {
    // Externalize packages that rely on Node/CommonJS entrypoints during SSR.
    external: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-router',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-i18next',
      'use-sync-external-store',
      'use-sync-external-store/shim',
    ],
    // Only bundle packages that need Vite transforms during SSR.
    noExternal: /^(quill|react-quill|react-quill-new|swiper|overlayscrollbars|overlayscrollbars-react)(\/|$)/
  },
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: ['react', 'react-dom', 'react-router-dom', 'react-router']
  }
}))
