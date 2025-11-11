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
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
    cssCodeSplit: true,
  },

  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },

  envPrefix: 'VITE_',
  base: '/',
});