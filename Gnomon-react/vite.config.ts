import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
plugins: [
react(),
...(isProd
? [
VitePWA({
registerType: 'autoUpdate',
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
// se quiser, depois a gente volta com o workbox runtimeCaching
}),
]
: []),
],
})