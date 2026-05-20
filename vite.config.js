// HUI vite.config.js — Safari MIME-safe v2
// manualChunks: Supabase entfernt (war leer wegen dynamic import in App.jsx)
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
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('src/components/HuiPlusSheet') ||
              id.includes('src/components/HuiMatchOverlay') ||
              id.includes('src/components/HuiMembershipFlow') ||
              id.includes('src/components/HuiCreateFlow') ||
              id.includes('src/components/teilen/') ||
              id.includes('src/components/connection-create/')) {
            return 'hui-overlays';
          }
          if (id.includes('src/pages/creator-profile/') ||
              id.includes('src/pages/wirker-profile/')) {
            return 'hui-profiles';
          }
        },
      },
    },
  },
});
