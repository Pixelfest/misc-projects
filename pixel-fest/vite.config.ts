import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte()],
  optimizeDeps: { exclude: ['wasm-webp'] },
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
