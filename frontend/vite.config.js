import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Split large vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router'],
          'query': ['@tanstack/react-query'],
          'stream-chat': ['stream-chat', 'stream-chat-react'],
          'stream-video': ['@stream-io/video-react-sdk'],
          'ui': ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    // Increase chunk size warning limit (stream SDKs are large)
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify
    minify: 'esbuild',
  },
})
