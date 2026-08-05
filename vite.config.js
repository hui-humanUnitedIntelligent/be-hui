import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ══════════════════════════════════════════════════════════════════════════════
// Vite Configuration — HUI Multi-Entry Build
// ══════════════════════════════════════════════════════════════════════════════
//
// ENTRIES:
//   main → index.html → src/main.jsx → src/App.jsx     (Mobile App, UNVERÄNDERT)
//   web  → web.html   → src/web-main.jsx → src/WebApp.jsx  (Web, NEU)
//
// BEIDE ENTRIES TEILEN:
//   - Alle node_modules (React, Supabase, Stripe, etc.) → vendor chunk
//   - Alle gemeinsamen Source-Dateien (services, hooks, contexts, etc.)
//   - Tailwind CSS + Design System CSS Variables
//
// CAPACITOR:
//   Nutzt weiterhin www/index.html (Mobile Entry).
//   www/web.html existiert im Output, wird von Capacitor ignoriert.
// ══════════════════════════════════════════════════════════════════════════════

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2018',
    outDir: 'www',

    // Weniger Dateien → schnellerer Android-Build
    cssCodeSplit: false,

    // Aggressives Minify
    minify: 'terser',

    // Sourcemaps deaktivieren → 30–50% schneller
    sourcemap: false,

    // Kleinere JS-Bundles
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Große Assets splitten → schnelleres Laden
    modulePreload: false,  // Verhindert automatisches Preloading von lazy-Chunks (TDZ-Fix)

    rollupOptions: {
      // ── Multi-Entry: Mobile + Web ───────────────────────────────────────
      input: {
        main: 'index.html',   // Mobile App (bestehend, unverändert)
        web: 'web.html',       // Web Version (neu)
      },

      output: {
        manualChunks(id) {
          // Stripe MUSS separat bleiben — hat TDZ-Fehler wenn synchron mit vendor geladen.
          // Eigener chunk → wird NUR geladen wenn lazy-import getriggert wird.
          if (id.includes('@stripe')) {
            return 'stripe';
          }
          // Restliche node_modules → gemeinsamer vendor-chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },

    // Weniger Output → schnelleres Capacitor-Sync
    assetsInlineLimit: 4096,
  },

  // ---- Mobile Optimierung ----
  server: {
    port: 5173,
    strictPort: true,
  },

  // ---- Wichtig für Capacitor ----
  base: './',
});
