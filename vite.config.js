import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

const BUILD_TS = Math.floor(Date.now() / 1000);
let GIT_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || 'local';
try {
  GIT_COMMIT = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
} catch { /* detached / no git */ }

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD__: BUILD_TS,
    __GIT_COMMIT__: JSON.stringify(GIT_COMMIT),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Timestamp im Namen → Vercel kann nicht cachen
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
