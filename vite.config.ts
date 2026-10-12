import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false, // Do not publish source maps.
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    esbuild: {
      drop: ['console', 'debugger'], // Remove console and debugger statements from production builds.
    },
    server: {
      // Set DISABLE_HMR=true in environments where hot reloading is not needed.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR=true.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
