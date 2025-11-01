import path from "path"
import { readFileSync } from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

const pwaManifest = JSON.parse(
  readFileSync(new URL("./public/manifest.webmanifest", import.meta.url), "utf-8")
)

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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/spirithubapi\.sbc\.om\/?.*/i,
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
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
    minify: 'esbuild'
  }
})
