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
    outDir: "www",
    rollupOptions: {
      output: {
        // Timestamp im Namen → Vercel kann nicht cachen
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Code-Splitting: Vendor-Libs in eigene Chunks → besseres Caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('stripe')) return 'stripe-vendor';
            if (id.includes('mapbox') || id.includes('leaflet') || id.includes('turf')) return 'map-vendor';
            if (id.includes('framer-motion') || id.includes('motion')) return 'motion-vendor';
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('luxon')) return 'date-vendor';
            if (id.includes('chart') || id.includes('recharts') || id.includes('d3')) return 'chart-vendor';
            if (id.includes('i18n') || id.includes('intl')) return 'i18n-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
})
