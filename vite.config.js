// build-trigger: 2026-08-11 12:41:30
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2018',
    outDir: 'www',
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    modulePreload: false,

    rollupOptions: {
      external: ['@capacitor/filesystem', '@capacitor/share'],
      input: {
        main: 'index.html',
        web: 'web.html',
      },

      output: {
        manualChunks(id) {
          if (id.includes('@stripe')) {
            return 'stripe';
          }
          // heic2any als eigener Chunk — wird nur bei HEIC-Upload dynamisch geladen
          if (id.includes('heic2any') || id.includes('libheif-js')) {
            return 'heic';
          }
          // jspdf in eigenen Chunk — wird nur dynamisch importiert (StatistikenModal, generateReceipt)
          // Ohne diese Regel würde jspdf (~300 KB) im Vendor landen und Public-Load belasten
          if (id.includes('jspdf') || id.includes('fflate') || id.includes('fast-png')) {
            return 'jspdf';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },

    assetsInlineLimit: 4096,
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  base: './',
});
