// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import react from '@astrojs/react'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'

import sentryAstro from '@sentry/astro'

const src = fileURLToPath(new URL('./src', import.meta.url))
const loadedEnv = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  ''
)
Object.assign(process.env, loadedEnv)

// Node adapter in standalone mode emits dist/server/entry.mjs, runnable by
// either Node or Bun; this is the single self-host runtime for dev, CI, Docker.
const adapter = node({ mode: 'standalone' })

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
    // Sentry/Rustrak: discovers sentry.server.config.ts and sentry.client.config.ts
    // at the project root. The server config is injected at SSR startup (init
    // no-ops when SENTRY_DSN is unset); the client SDK is injected on every page
    // and reports browser errors when PUBLIC_SENTRY_DSN is set (no-op otherwise).
    // React islands can additionally use wrapReactComponentWithSentry for boundaries.
    sentryAstro({
      enabled: { server: true, client: true },
    }),
  ],
  output: 'server',
  adapter,

  // Image stance (C.5): no `image.remotePatterns`/`image.domains` is configured
  // on purpose, so Astro's `/_image` endpoint refuses remote transforms (400)
  // and only local images are transformable. All remote media flows through
  // the hardened `/media` proxy instead (SSRF allowlist, MIME allowlist, byte
  // budgets). Revisit only with an explicit allowlist + e2e coverage.

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': src,
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@anime': fileURLToPath(
          new URL('./src/domains/anime', import.meta.url)
        ),
        '@manga': fileURLToPath(
          new URL('./src/domains/manga', import.meta.url)
        ),
        '@auth': fileURLToPath(new URL('./src/domains/auth', import.meta.url)),
        '@media': fileURLToPath(
          new URL('./src/domains/media', import.meta.url)
        ),
        '@music': fileURLToPath(
          new URL('./src/domains/music', import.meta.url)
        ),
        '@user': fileURLToPath(new URL('./src/domains/user', import.meta.url)),
        '@search': fileURLToPath(
          new URL('./src/domains/search', import.meta.url)
        ),
        '@producer': fileURLToPath(
          new URL('./src/domains/producer', import.meta.url)
        ),
        '@seo': fileURLToPath(new URL('./src/domains/seo', import.meta.url)),
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
