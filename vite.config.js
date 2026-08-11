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
