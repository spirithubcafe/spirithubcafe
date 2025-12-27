import path from "path"
import { readFileSync } from "fs"
import fs from "fs/promises"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig, type ViteDevServer } from "vite"
import type { IncomingMessage, ServerResponse } from "http"

const pwaManifest = JSON.parse(
  readFileSync(new URL("./public/manifest.webmanifest", import.meta.url), "utf-8")
)

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
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "images/logo/logo-light.png",
        "images/logo/logo-dark.png",
        "video/back.mp4"
      ],
      manifest: pwaManifest,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.spirithubcafe\.com\/?.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        navigateFallback: "index.html",
        type: "module"
      }
    }),
    seoWriterPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core libraries
          vendor: ['react', 'react-dom'],
          // Icons and UI
          ui: ['lucide-react'],
          // i18n
          i18n: ['react-i18next', 'i18next'],
          // Router
          router: ['react-router-dom']
        }
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
    // Externalize all React-related packages to use Node.js CommonJS versions
    external: ['react', 'react-dom', 'react-router-dom', 'react-router', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    // Don't try to bundle browser-only libraries
    noExternal: /^(?!quill|react-quill|swiper|overlayscrollbars)/
  },
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: ['react', 'react-dom', 'react-router-dom', 'react-router']
  }
})
