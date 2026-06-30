import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the build works on GitHub Pages
// project subpaths, Vercel, or any static host without reconfiguration.
export default defineConfig({
  plugins: [react()],
  base: './',
})
