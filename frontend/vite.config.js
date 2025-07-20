import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/assessments/pdf': {
        target: 'http://localhost:4000', // or your backend port
        changeOrigin: true,
        secure: false
      }
    }
  }
})
