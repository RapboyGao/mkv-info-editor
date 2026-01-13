import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, 'frontend'),
  build: {
    outDir: resolve(__dirname, 'frontend/dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})