// Gnomon-react/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// Remova a variável 'isProd' e o operador ternário

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      
      // 1. Configuração para desabilitar a geração em dev
      devOptions: {
        enabled: false // <-- Garante que o Service Worker não será gerado/registrado em 'npm run dev'
      },
      
      // 2. Configurações de Produção (que só serão aplicadas em 'npm run build')
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'offline.html'],
      manifest: {
        name: 'GNOMON',
        short_name: 'GNOMON',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0b0f11',
        theme_color: '#0b0f11',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})