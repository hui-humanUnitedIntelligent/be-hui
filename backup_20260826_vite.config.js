import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// ── Pre-Build: Backup-Dateien-Check (Punkt 10.8) ─────────────────
// Build MUSS abbrechen, wenn .bak/.old/backup_* Dateien in src/ erkannt werden.
function checkBackupFiles() {
  const blockedDirs = ['src', 'android/app/src/main/java', 'android/app/src/main/res'];
  const issues = [];
  for (const dir of blockedDirs) {
    try {
      function scan(d) {
        for (const entry of readdirSync(d)) {
          const full = join(d, entry);
          try {
            if (statSync(full).isDirectory()) { scan(full); continue; }
          } catch (_) { continue; }
          if (entry.startsWith('backup_') || entry.endsWith('.bak') || entry.endsWith('.old')) {
            issues.push(full);
          }
        }
      }
      scan(dir);
    } catch (_) {} // Dir doesn't exist, skip
  }
  if (issues.length > 0) {
    console.error('\n❌ BUILD GATE: Backup-Dateien im Source-Tree erkannt (Punkt 10.8):');
    issues.forEach(f => console.error('   ' + f));
    console.error('   Verschiebe sie nach backups/ oder lösche sie.\n');
    process.exit(1);
  }
}

export default defineConfig({
  plugins: [
    { name: 'hui-backup-gate', buildStart() { checkBackupFiles(); } },
    react(),
  ],

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
      // BELEG-004 (2026-08-14): externals entfernt — generateReceipt.js importiert
      // @capacitor/filesystem/@capacitor/share nicht mehr direkt (registerPlugin-Proxy
      // Pattern statt npm-Paket-Import, siehe Kommentar in src/lib/generateReceipt.js).
      // Kein Code im Projekt importiert diese Pakete mehr — daher kein external nötig.
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
