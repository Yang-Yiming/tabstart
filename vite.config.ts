import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getUserPluginsRoot } from './scripts/user-plugins-dir.js'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    // User plugins reach host internals via '@host/*'; their own modules are
    // imported by the generated registry via '@ext/<rel>/plugin'.
    alias: {
      '@host': resolve(process.cwd(), 'src'),
      '@ext': getUserPluginsRoot(),
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
