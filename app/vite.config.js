import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PashuPulse - Livestock Health & Advisory',
        short_name: 'PashuPulse',
        description: 'Offline-First Livestock Health & Advisory App for Rural Farmers',
        theme_color: '#16a34a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
      }
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
