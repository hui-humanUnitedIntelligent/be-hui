// HUI 2026-05-18T18:42:04Z fix: orbOpen ReferenceError — KEIN orbOpen im Repo, Cache-Invalidierung
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
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ── Code Splitting Strategy ──────────────────────────────────
    // Ziel: < 180KB Initial + Lazy-Chunks on demand
    //
    // Chunk-Hierarchie:
    //   react-vendor:    React + Router (sehr stabil, lang cacheable)
    //   supabase:        Supabase SDK (eigener Chunk)
    //   ui-vendor:       Radix + Framer + Lucide (UI-Libs)
    //   intelligence:    Discovery + Graph + Context + Health (lazy-fähig)
    //   index:           App-Shell (LoginPage, Auth, Root)
    rollupOptions: {
      output: {
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // ── React Core (stabilster Chunk) ───────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // ── Supabase (separat — ändert sich mit SDK-Updates) ─
          if (id.includes('node_modules/@supabase/') ||
              id.includes('node_modules/ws/') ||
              id.includes('node_modules/isomorphic-ws/')) {
            return 'supabase-vendor';
          }

          // ── UI Libraries (tree-shakeable, aber Radix ist groß) ─
          if (id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/framer-motion/') ||
              id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/clsx/')) {
            return 'ui-vendor';
          }

          // ── Heavy Extras (Karte, Editor — selten gebraucht) ─
          if (id.includes('node_modules/react-leaflet/') ||
              id.includes('node_modules/leaflet/') ||
              id.includes('node_modules/react-quill/') ||
              id.includes('node_modules/quill/') ||
              id.includes('node_modules/react-markdown/')) {
            return 'extras-vendor';
          }

          // ── Sentry (eigener Chunk — groß, selten genutzt) ──
          if (id.includes('node_modules/@sentry/')) {
            return 'sentry-vendor';
          }

          // ── HUI Intelligence Layer ──────────────────────────
          // Wird lazy geladen — nicht im Initial-Bundle
          if (id.includes('/src/lib/discovery/') ||
              id.includes('/src/lib/graph/') ||
              id.includes('/src/lib/contextual/') ||
              id.includes('/src/lib/communityHealth/') ||
              id.includes('/src/lib/pipeline/') ||
              id.includes('/src/lib/realtime/') ||
              id.includes('/src/lib/workers/')) {
            return 'intelligence';
          }

          // ── HUI Cache + Budget (klein, early init) ─────────
          if (id.includes('/src/lib/cache/') ||
              id.includes('/src/lib/budgets/')) {
            return 'hui-infra';
          }
        },
      },
    },

    // ── Build Targets ────────────────────────────────────────────
    target: 'es2020',           // Moderne Browser — kein IE Legacy
    minify: 'esbuild',          // Schnellster Minifier
    sourcemap: false,           // In Prod kein Sourcemap (Sentry uploadt separat)

    // ── Chunk Size Warnings ──────────────────────────────────────
    chunkSizeWarningLimit: 300, // Warn wenn Chunk > 300KB (Ziel: < 200KB)
  },
});