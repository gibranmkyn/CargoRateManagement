import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
    // Ensure shared/ files resolve dependencies from admin/node_modules
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
