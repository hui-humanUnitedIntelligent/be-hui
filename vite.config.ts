// HUI build 2026-05-17T15:22:21Z — Phase 5G: Community Health Engine
import path from 'path'
import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  resolve: {
    alias: {
      // @-Alias: alle Imports können jetzt @/lib/... statt ../../../lib/... nutzen
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Chunk-Hashing erzwingen — verhindert Browser-Caching alter Bundles
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});