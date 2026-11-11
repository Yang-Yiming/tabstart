import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    // react-draggable's debug logger reads this Node-style env var at runtime.
    // Vite does not define an arbitrary `process.env` in the browser, so an
    // un-replaced reference throws as soon as a drag starts.
    'process.env.DRAGGABLE_DEBUG': 'false',
  },
  resolve: {
    // User plugins reach host internals via '@host/*'; their own modules are
    // imported by the registry's static glob via '@ext/<rel>/plugin'.
    alias: {
      '@host': resolve(process.cwd(), 'src'),
      '@ext': resolve(process.cwd(), 'user-plugins'),
    },
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  server: {
    proxy: {
      '/opencode-go-api': {
        target: 'https://opencode.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opencode-go-api/, ''),
      },
    },
  },
})
