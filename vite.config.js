// HUI vite.config.js — Chunk Stability v5
// manualChunks: explizite Gruppierung verhindert Hash-Drift bei kleinen Änderungen
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
    chunkSizeWarningLimit: 2000,
    // Stabile Asset-Dateinamen: Hash basiert auf Inhalt → kein Hash-Drift
    // bei unveränderten Chunks
    rollupOptions: {
      output: {
        // Explizite manualChunks: stabilere Hashes, weniger MIME-Fehler nach Deploy
        manualChunks(id) {
          // ── Vendor: React-Kern ──────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // ── Vendor: Supabase ────────────────────────────────
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // ── Vendor: Sentry ──────────────────────────────────
          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-sentry';
          }
          // ── Alle anderen node_modules ───────────────────────
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
          // ── HUI System: Orb + Flows ─────────────────────────
          if (id.includes('/system/orb/') || id.includes('/system/flows/')) {
            return 'hui-system';
          }
          // ── HUI Lib: Context + Services ─────────────────────
          if (id.includes('/lib/') || id.includes('/services/')) {
            return 'hui-lib';
          }
          // Alle anderen: Vite entscheidet (per-component chunks)
        },
        // Chunk-Dateinamen: [name]-[hash].js (Standard, stabil)
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
