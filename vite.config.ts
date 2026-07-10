/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the build works on GitHub Pages
// project subpaths, Vercel, or any static host without reconfiguration.
export default defineConfig({
  plugins: [react()],
  base: './',
  // Scope tests to the app's own modules; .claude/ carries unrelated tooling
  // with its own test suites that vitest's default glob would otherwise crawl.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
