import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Le backend expose ses routes sous `/api/v1/v1` (préfixe global `api/v1`
// + versioning URI par défaut `v1`). En dev, on proxifie `/api` vers le
// backend Nest afin d'éviter tout souci CORS et de garder des URLs relatives.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
