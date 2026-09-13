/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered manually from main.tsx instead, so it's visible in
      // application code rather than an auto-injected script tag.
      injectRegister: null,
      manifest: {
        name: 'Meditation App',
        short_name: 'Meditation',
        description:
          'A calm, modern meditation app for guided sessions, breathing exercises and mindful sounds.',
        start_url: '/',
        display: 'standalone',
        background_color: '#faf8f5',
        theme_color: '#faf8f5',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache only the built app shell (JS/CSS/HTML/icons). Never
        // widen this to audio file extensions — the spec explicitly
        // forbids automatically caching the whole meditation audio
        // library; offline audio is a deliberate future feature.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
