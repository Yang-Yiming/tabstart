import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    // User plugins reach host internals via '@host/*'; their own modules are
    // imported by the registry's static glob via '@ext/<rel>/plugin'.
    alias: {
      '@host': resolve(process.cwd(), 'src'),
      '@ext': resolve(process.cwd(), 'user-plugins'),
    },
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
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
