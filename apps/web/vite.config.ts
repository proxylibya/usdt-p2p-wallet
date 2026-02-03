import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';
    
    return {
      define: {
        // Keep this for efficient tree-shaking
        'process.env.NODE_ENV': JSON.stringify(mode),
        // Safety fallbacks if polyfills miss something
        global: 'window',
        'process': 'window.process',
        'Buffer': 'window.Buffer',
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: true,
          timeout: 5000,
        },
        watch: {
          usePolling: true,
          interval: 1000,
        },
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        nodePolyfills({
          include: ['process', 'buffer', 'util', 'stream', 'events'],
          globals: {
            Buffer: true,
            global: true,
            process: true,
          },
        }),
        react({
          babel: {
            plugins: isProd ? [
              ['transform-remove-console', { exclude: ['error', 'warn'] }]
            ] : [],
          },
        }),
      ],
      resolve: {
        mainFields: ['module', 'jsnext:main', 'jsnext'],
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@context': path.resolve(__dirname, './context'),
          '@components': path.resolve(__dirname, './components'),
          '@services': path.resolve(__dirname, './services'),
          '@hooks': path.resolve(__dirname, './hooks'),
          '@pages': path.resolve(__dirname, './pages'),
          '@app-types': path.resolve(__dirname, './types.ts'),
          '@constants': path.resolve(__dirname, './constants.tsx'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
        exclude: ['@capacitor/core'],
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: !isProd,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-ui': ['lucide-react', 'recharts'],
              'vendor-charts': ['lightweight-charts'],
            },
            chunkFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
            entryFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
            assetFileNames: isProd ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
          }
        }
      },
      esbuild: {
        legalComments: 'none',
        drop: isProd ? ['console', 'debugger'] : [],
      },
    };
});
