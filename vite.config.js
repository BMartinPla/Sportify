import { defineConfig } from 'vite';
export default defineConfig({ resolve:{preserveSymlinks:true}, optimizeDeps:{esbuildOptions:{preserveSymlinks:true}}, build: { outDir: 'dist/client', emptyOutDir: true }, server: { host: '127.0.0.1' } });
