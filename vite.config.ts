import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

const config: UserConfig = {
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'three'
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('@supabase')) return 'supabase'
        }
      }
    }
  }
}

export default defineConfig(config)
