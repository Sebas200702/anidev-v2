/**
 * Playwright global setup — serially warms the freshly-built server.
 *
 * @module e2e/global-setup
 * @remarks
 * `webServer` gates startup on `GET /api/health/readiness` (DB + cache reachable),
 * but that probe does not exercise the per-route lazy ESM chunks, query plans, or
 * pooled DB connections that a route needs on its *first* hit. Without warming,
 * the moment readiness flips green Playwright fires the full parallel suite at a
 * stone-cold server — mixing anime list/count queries with Better Auth registers
 * (hashing + inserts) — and the first concurrent hits occasionally race lazy
 * initialization into a transient 500 *above* the route handler (so the app never
 * logs it). That is a cold-start artifact, not a product defect: real deployments
 * serve warmup traffic before load.
 *
 * This runs once, after `webServer` is ready and before any test (Playwright
 * composes webServer setup ahead of globalSetup), issuing the route families the
 * suite touches — serially — so every lazy chunk, prepared statement, and pool
 * connection is live before the parallel storm.
 *
 * @see playwright.config.ts — `globalSetup` + `webServer`
 */
import { type FullConfig, request } from '@playwright/test'

/** Resolve the configured base URL from any project's `use` block. */
function resolveBaseURL(config: FullConfig): string {
  for (const project of config.projects) {
    const baseURL = project.use.baseURL
    if (baseURL) return baseURL
  }
  throw new Error('global-setup: no project defines a baseURL')
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = resolveBaseURL(config)
  // A real browser SPA sends a same-origin Origin header; Astro's CSRF guard
  // needs it on mutating requests. Mirror the fixtures so the warm register works.
  const context = await request.newContext({
    baseURL,
    extraHTTPHeaders: { accept: 'application/json', origin: baseURL },
  })

  try {
    // Read paths — prime anime list/count + music query plans and their chunks.
    await context.get('/api/anime?page=1&limit=5')
    await context.get('/api/anime?page=0') // validation path (400) — warms the wrapper
    await context.get('/api/music?page=1&limit=5')

    // Write/auth path — prime Better Auth register (hashing + insert) and the
    // session-resolution middleware that every subsequent request flows through.
    await context.post('/api/auth/register', {
      data: {
        email: `e2e-warmup-${Date.now()}@example.test`,
        password: 'e2e-password-1234',
        name: 'E2E Warmup',
      },
    })
  } finally {
    await context.dispose()
  }
}
