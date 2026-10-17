import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/audio': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/diagnose': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/history': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/manual': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
