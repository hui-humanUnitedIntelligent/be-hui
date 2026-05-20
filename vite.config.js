// HUI vite.config.js — Safari MIME-safe
// - manualChunks: kritische Overlays gebündelt → weniger Chunks
// - assetsDir: "assets" explizit → vercel.json passt korrekt
// - chunkSizeWarningLimit erhöht
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
        /* Kritische Overlays in einem Chunk — Safari lädt weniger Requests */
        manualChunks(id) {
          // React + React-DOM → eigener stabiler Chunk
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Supabase → eigener Chunk
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Framer Motion → eigener Chunk (groß)
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          // HUI Overlay-Flows → ein gemeinsamer Chunk (weniger HTTP-Requests)
          if (id.includes('src/components/HuiPlusSheet') ||
              id.includes('src/components/HuiMatchOverlay') ||
              id.includes('src/components/HuiMembershipFlow') ||
              id.includes('src/components/HuiCreateFlow') ||
              id.includes('src/components/teilen/') ||
              id.includes('src/components/connection-create/')) {
            return 'hui-overlays';
          }
          // Profile-System → ein Chunk
          if (id.includes('src/pages/creator-profile/') ||
              id.includes('src/pages/wirker-profile/')) {
            return 'hui-profiles';
          }
        },
      },
    },
  },
});
