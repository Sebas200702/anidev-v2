// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

import react from '@astrojs/react'

import tailwindcss from '@tailwindcss/vite'
import bun from '@nurodev/astro-bun'

import vercel from '@astrojs/vercel'

import sentryAstro from '@sentry/astro'

const src = fileURLToPath(new URL('./src', import.meta.url))

// ASTRO_ADAPTER=bun emits a standalone Bun server (dist/server/entry.mjs),
// used by the Docker image runtime. Default (Vercel) targets the serverless
// deploy output and is used by CI.
const adapter = process.env.ASTRO_ADAPTER === 'bun' ? bun() : vercel()

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
  integrations: [
    sessionMiddlewareIntegration,
    react(),
    // Sentry/Rustrak: discovers sentry.server.config.ts at the project root and
    // injects it at SSR startup (init no-ops when SENTRY_DSN is unset). Client
    // SDK stays disabled — browser error boundaries go through
    // wrapReactComponentWithSentry instead.
    sentryAstro({
      enabled: { server: true, client: false },
    }),
  ],
  output: 'server',
  adapter,

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': src,
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@anime': fileURLToPath(
          new URL('./src/domains/anime', import.meta.url)
        ),
        '@auth': fileURLToPath(new URL('./src/domains/auth', import.meta.url)),
        '@media': fileURLToPath(
          new URL('./src/domains/media', import.meta.url)
        ),
        '@music': fileURLToPath(
          new URL('./src/domains/music', import.meta.url)
        ),
        '@user': fileURLToPath(new URL('./src/domains/user', import.meta.url)),
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
