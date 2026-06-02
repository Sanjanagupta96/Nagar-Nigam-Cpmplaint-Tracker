import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend WAR context path (Tomcat will use WAR name as context)
const BACKEND_ORIGIN = 'http://localhost:8080';
const BACKEND_CONTEXT = '/nagar-nigam-backend';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // React -> Tomcat (with session cookies)
      '/api': {
        target: `${BACKEND_ORIGIN}${BACKEND_CONTEXT}`,
        changeOrigin: true,
        secure: false
      }
    }
  }
});

