import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'elite-trades' to match your GitHub repo name exactly
  base: '/elite-trades/',
})
