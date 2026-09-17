import { defineConfig } from 'vite';
import { pwaBuild } from './scripts/pwa-build.js';

export default defineConfig({
  base: './',
  plugins: [pwaBuild()],
  // This is also the user's play server: source edits must not reload a live world.
  server: { host: '127.0.0.1', port: 5180, strictPort: true, hmr: false },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true },
  // Three already ships browser-ready modules; skip dependency prebundling.
  optimizeDeps: { noDiscovery: true, include: [], exclude: ['three'] },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
