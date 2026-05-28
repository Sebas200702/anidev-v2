// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

import react from '@astrojs/react'

import tailwindcss from '@tailwindcss/vite'
import bun from '@nurodev/astro-bun'

const src = fileURLToPath(new URL('./src', import.meta.url))

/** @type {import('astro').AstroIntegration} */
const sessionMiddlewareIntegration = {
  name: 'session-middleware',
  hooks: {
    'astro:config:setup': ({ addMiddleware }) => {
      addMiddleware({
        entrypoint: new URL(
          './src/middleware/auth-middleware.ts',
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
  output: 'server',
  adapter: bun(),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': src,
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@domains': fileURLToPath(new URL('./src/domains', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
        '@middleware': fileURLToPath(
          new URL('./src/middleware', import.meta.url)
        ),
        '@layouts': fileURLToPath(
          new URL('./src/shared/layouts', import.meta.url)
        ),
        '@http': fileURLToPath(new URL('./src/shared/http', import.meta.url)),
        '@components': fileURLToPath(
          new URL('./src/shared/components', import.meta.url)
        ),
        '@hooks': fileURLToPath(new URL('./src/shared/hooks', import.meta.url)),
        '@stores': fileURLToPath(
          new URL('./src/shared/stores', import.meta.url)
        ),
        '@utils': fileURLToPath(new URL('./src/shared/utils', import.meta.url)),
        '@db': fileURLToPath(new URL('./src/lib/db', import.meta.url)),
      },
    },
  },
})
