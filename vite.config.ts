import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/api' : 'http://localhost:5000'
    }
  },
  build: {
    // Enable source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'utils-vendor': ['axios', 'date-fns'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minify
    minify: 'esbuild',
    // Enable compression
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // CommonJS options for better compatibility
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', '@supabase/supabase-js'],
    esbuildOptions: {
      // Fix for CommonJS modules
      mainFields: ['module', 'main'],
    },
  },
  resolve: {
    // Ensure proper module resolution
    dedupe: ['@supabase/supabase-js'],
  },
})