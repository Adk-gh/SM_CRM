import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // 👇 ADDED THIS SECTION
  build: {
    chunkSizeWarningLimit: 1600, // Increases the warning limit so it's less noisy
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. Split Firebase dependencies into their own file
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          // 2. Split React dependencies into their own file
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          // 3. Put everything else in a generic vendor file
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})