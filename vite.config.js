import { defineConfig } from 'vite';
import { createRequire } from 'node:module';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);

// Resolve jspdf/fflate/fast-png paths for diagnostics
let jspdfPath = 'NOT-FOUND';
let fflatePath = 'NOT-FOUND';
let fastPngPath = 'NOT-FOUND';
try { jspdfPath = require.resolve('jspdf'); } catch(e) { jspdfPath = 'ERROR: ' + e.message; }
try { fflatePath = require.resolve('fflate'); } catch(e) { fflatePath = 'ERROR: ' + e.message; }
try { fastPngPath = require.resolve('fast-png'); } catch(e) { fastPngPath = 'ERROR: ' + e.message; }

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'jspdf-diagnostic',
      buildStart() {
        console.error('[JSPDF-DIAG] cwd:', process.cwd());
        console.error('[JSPDF-DIAG] jspdfPath:', jspdfPath);
        console.error('[JSPDF-DIAG] fflatePath:', fflatePath);
        console.error('[JSPDF-DIAG] fastPngPath:', fastPngPath);
      },
      transformIndexHtml(html) {
        // Inject debug info as HTML comment — visible in live HTML source
        const debug = `<!-- JSPDF-DIAG cwd=${process.cwd()} jspdf=${jspdfPath} fflate=${fflatePath} fastpng=${fastPngPath} -->`;
        return html + '\n' + debug;
      },
    },
  ],

  define: { __BUILD_MARKER__: JSON.stringify("phase8-verify-2026-08-11") },

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
          if (id.includes('heic2any') || id.includes('libheif-js')) {
            return 'heic';
          }
          // jspdf split — check multiple patterns for cross-platform compatibility
          if (
            id.includes('jspdf') ||
            id.includes('fflate') ||
            id.includes('fast-png') ||
            id.startsWith(jspdfPath) ||
            id.startsWith(fflatePath) ||
            id.startsWith(fastPngPath) ||
            id.includes('/jspdf/') ||
            id.includes('\\jspdf\\') ||
            id.includes('/fflate/') ||
            id.includes('\\fflate\\') ||
            id.includes('/fast-png/') ||
            id.includes('\\fast-png\\')
          ) {
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
