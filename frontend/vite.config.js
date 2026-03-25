import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fix HMR WebSocket connection issues
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // Allow connections from any host (needed for mobile testing)
    host: true,
  },
  build: {
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
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
  },
})
