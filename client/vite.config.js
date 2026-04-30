import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // libsodium-wrappers-sumo v0.7.16 (ESM build) reference un fichier interne
  // non publie -- on demande a Vite/esbuild de le pre-bundler de force, pour
  // qu'esbuild resolve correctement le module avant que Rollup le voit.
  optimizeDeps: {
    include: ['libsodium-wrappers-sumo']
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
