import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  server: {
    host: true, // 监听 0.0.0.0，允许外部访问
    allowedHosts: true, // 放行所有域名
    fs: {
      // 允许访问 data 目录
      allow: ['.'],
    },
  },
})
