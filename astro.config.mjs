// @ts-check
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'

import tailwindcss from '@tailwindcss/vite'
import bun from '@nurodev/astro-bun'

/** @type {import('astro').AstroIntegration} */
const sessionMiddlewareIntegration = {
  name: 'session-middleware',
  hooks: {
    'astro:config:setup': ({ addMiddleware }) => {
      addMiddleware({
        entrypoint: new URL(
          './src/core/http/middlewares/session.ts',
          import.meta.url
        ),
        order: 'pre',
      })
    },
  },
}

// https://astro.build/config
export default defineConfig({
  integrations: [sessionMiddlewareIntegration, react()],
  output: 'server', // indica que no es solo static
  adapter: bun(),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
})
