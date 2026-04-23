import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src-web',
  port: 8080,
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src-web'),
    },
  },
  clearScreen: false,
});