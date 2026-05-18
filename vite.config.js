import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg'],
      manifest: {
        name: 'Sistema de Gestión de Facturas',
        short_name: 'Gestión Facturas',
        description: 'Sistema de gestión administrativa de facturas - Facturación, clientes y cobranzas',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        screenshots: [],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Ver resumen del dashboard',
            url: '/',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }]
          },
          {
            name: 'Nueva Factura',
            short_name: 'Nueva Factura',
            description: 'Crear una nueva factura',
            url: '/facturas',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.ocr\.space\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ocr-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        navigateFallback: '/'
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});