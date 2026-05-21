import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Minimal stable config — kein manualChunks, kein rollupOptions
// @ Alias benoetigt fuer src/pages/PlatformDashboard und andere @/lib imports
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
