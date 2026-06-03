import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Build: 1780508942 — forces new bundle hash (Vercel cache bust)
export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: 1780508942 },
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
