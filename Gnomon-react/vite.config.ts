import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import os from 'os';
import qrcode from 'qrcode-terminal';

function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips: { type: string; ip: string; icon: string }[] = [];

  for (const name in interfaces) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        if (alias.address.startsWith('172.')) {
          ips.push({ type: 'Docker/WSL', ip: alias.address, icon: '🐳' });
        } else if (alias.address.startsWith('192.168.56.')) {
          ips.push({ type: 'Máquina Virtual', ip: alias.address, icon: '🖥️' });
        } else if (alias.address.startsWith('192.168.')) {
          ips.push({ type: 'Testar no celular', ip: alias.address, icon: '📱' });
        } else {
          ips.push({ type: 'Rede', ip: alias.address, icon: '🌐' });
        }
      }
    }
  }

  return ips;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'custom-server-logs',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setTimeout(() => {
            const port = 5173;
            const ips = getNetworkIPs();
            const mobileIP = ips.find(ip => ip.icon === '📱');

            console.clear();
            console.log('');
            console.log('  \x1b[1m\x1b[32m🚀 GNOMON DEV SERVER\x1b[0m');
            console.log('');
            console.log('  \x1b[1m💻 Desenvolvimento no PC:\x1b[0m');
            console.log(`     \x1b[36mhttp://localhost:${port}/\x1b[0m`);
            console.log('');

            if (ips.length > 0) {
              console.log('  \x1b[1mAcessar de outros dispositivos:\x1b[0m');
              ips.forEach(({ type, ip, icon }) => {
                console.log(`     ${icon} ${type}: \x1b[36mhttp://${ip}:${port}/\x1b[0m`);
              });
              console.log('');
            }

            // QR Code para celular
            if (mobileIP) {
              console.log('  \x1b[1m📱 Escaneie com o celular:\x1b[0m');
              console.log('');
              qrcode.generate(`http://${mobileIP.ip}:${port}`, { small: true }, (code) => {
                console.log(code);
              });
              console.log('');
            }

            console.log('  \x1b[2mAperte \x1b[1mh + Enter\x1b[0m\x1b[2m para mostrar ajuda\x1b[0m');
            console.log('  \x1b[2mAperte \x1b[1mCtrl + C\x1b[0m\x1b[2m para encerrar\x1b[0m');
            console.log('');
          }, 100);
        });
      },
    },
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@libs': path.resolve(__dirname, './src/libs'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    headers: {
      'Cache-Control': 'no-cache',
    },
    
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
      },
    },

    cors: true,
  },

  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'particles-vendor': ['@tsparticles/react', '@tsparticles/slim', '@tsparticles/engine'],
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/img/[name]-[hash].[ext]';
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          if (/mp4|webm|ogg|mp3|wav|flac|aac/i.test(ext)) {
            return 'assets/media/[name]-[hash].[ext]';
          }
          if (/glb|gltf|obj|fbx/i.test(ext)) {
            return 'assets/models/[name]-[hash].[ext]';
          }
          return 'assets/[ext]/[name]-[hash].[ext]';
        },
      },
    },
    
    chunkSizeWarningLimit: 400,
    reportCompressedSize: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },

  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },

  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@tsparticles/react',
      '@tsparticles/slim',
    ],
    exclude: [],
  },

  // ✅ REMOVIDO: a seção css que estava causando erro
  // css: {
  //   devSourcemap: false,
  //   preprocessorOptions: {
  //     css: {  // ❌ CSS não é válido aqui
  //       charset: false,
  //     },
  //   },
  // },

  envPrefix: 'VITE_',
  base: '/',
});