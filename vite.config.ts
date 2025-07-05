import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Health Rocket',
        short_name: 'HealthRocket',
        description: 'Add 20+ years of healthy life with Health Rocket',
        theme_color: '#FF6B00',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        prefer_related_applications: false,
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          {
            src: '/HR Logo Image Only.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/HR Logo Image Only.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/HR Logo Image Only.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/HR Logo Image Only.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    https: false,
    hmr: {
      overlay: true
    },
    host: true,
    port: 5173,
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 4173
  },
  optimizeDeps: {
    include: ['lucide-react']
  },
  build: {
    sourcemap: true
  }
});