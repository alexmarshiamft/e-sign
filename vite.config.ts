import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-pdf'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['react-pdf'],
        },
      },
    },
  },
});
