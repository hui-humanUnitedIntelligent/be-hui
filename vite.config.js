// HUI vite.config.js — Safari MIME-safe v3
// manualChunks: hui-overlays/hui-profiles circular chunk behoben
// TeilenFlow + ConnectionCreate sind statisch → kein chunk nötig
import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true,
    }),
    react(),
  ],
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React vendor
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Framer Motion (groß, selten geändert)
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          // Alle anderen node_modules → vendor
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
});
