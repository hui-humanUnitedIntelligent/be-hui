import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ---- Mobile Performance Optimierung ----
export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2018',

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
    rollupOptions: {
      output: {
        manualChunks(id) {
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
