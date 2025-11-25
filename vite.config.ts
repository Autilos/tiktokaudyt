import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

export default defineConfig({
  base: '/tiktokaudyt/', // GitHub Pages base path
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Security: Ensure no sensitive environment variables leak into frontend
  define: {
    // Only allow VITE_ prefixed environment variables
    __DEV__: !isProd,
  },
  // Development server configuration
  server: {
    port: 5173,
    host: true, // Allow external connections for development
    cors: true,
    // Proxy API requests to secure proxy in development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  // Build configuration
  build: {
    // Security: Don't generate source maps in production to avoid exposing code structure
    sourcemap: !isProd,
    // Optimize for production
    minify: isProd ? 'terser' : false,
    terserOptions: isProd ? {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    } : undefined,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  // Environment handling
  envPrefix: 'VITE_',
  // Security headers for development
  preview: {
    port: 4173,
    host: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }
  }
})

