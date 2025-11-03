import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: 'localhost',
    open: '/frenchay-campus-map.html'
    // Remove HTTPS for now to test basic connectivity
  },
  build: {
    rollupOptions: {
      input: {
        main: '/frenchay-campus-map.html'
      }
    }
  }
})