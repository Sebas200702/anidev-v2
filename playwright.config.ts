/**
 * Playwright E2E configuration.
 *
 * @remarks
 * Runs the **real self-host artifact** — the Bun standalone server emitted by
 * `ASTRO_ADAPTER=bun astro build` (`dist/server/entry.mjs`), the same output
 * Docker/CI deploy — not `astro preview` (unavailable under the Vercel adapter).
 *
 * The server boots against a real Postgres + Dragonfly stack (docker-compose
 * locally, service containers in CI). The harness pins **host-reachable**
 * connection URLs: `DATABASE_URL` is inherited from the environment (the local
 * `.env` already uses `localhost:5432`, CI sets its own), while `REDIS_URL` is
 * pinned to the published `127.0.0.1:6379` port — the ambient `.env` value
 * (`redis://dragonfly:6379`) is a Docker-network hostname that does not resolve
 * for a server running on the host. Override either with `E2E_DATABASE_URL` /
 * `E2E_REDIS_URL`. The harness also pins the adapter, host/port, base URL, auth
 * secret, and log level.
 *
 * Readiness is gated on `GET /api/health/readiness` (probes DB + cache), so the
 * suite starts only once dependencies are actually reachable.
 *
 * @see openspec/changes/e2e-testing-methodology/design.md
 */
import { defineConfig, devices } from '@playwright/test'

const HOST = '127.0.0.1'
// Dedicated E2E port (not Astro's default 4321) so the harness never collides
// with — or reuses — a developer's running dev/preview server.
const PORT = 4331
const baseURL = `http://${HOST}:${PORT}`
const isCI = !!process.env.CI

// Host-reachable connection URLs for the spawned server. DATABASE_URL is inherited
// (local `.env` uses localhost; CI sets its own). REDIS_URL must NOT inherit the
// `.env` value `redis://dragonfly:6379` — that Docker-network hostname is
// unresolvable on the host; the published port is 127.0.0.1:6379. IPv4 is explicit
// (not `localhost`) because on CI runners `localhost` can resolve to IPv6 `::1`,
// which the service container's IPv4-only port map refuses.
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL
const REDIS_URL = process.env.E2E_REDIS_URL ?? 'redis://127.0.0.1:6379'

export default defineConfig({
  testDir: 'e2e',
  // Serially warm the freshly-built server (lazy chunks, query plans, DB pool)
  // after `webServer` is ready but before the parallel suite, eliminating
  // cold-start 500 races. @see e2e/global-setup.ts
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    // A real browser SPA always sends a same-origin `Origin` header; Astro's
    // `checkOrigin` CSRF guard rejects mutating requests without it (403). Send
    // it so E2E faithfully emulates the browser client and reaches real handlers.
    extraHTTPHeaders: { accept: 'application/json', origin: baseURL },
  },

  projects: [
    {
      name: 'api',
      testDir: 'e2e/api',
      use: {},
    },
    {
      name: 'ui',
      testDir: 'e2e/ui',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Local: build the Bun artifact then serve it (reused across runs). CI builds
    // in a dedicated step, so it only serves. Env below is injected by Playwright
    // (cross-platform), so no inline shell env vars are needed.
    command: isCI
      ? 'bun run dist/server/entry.mjs'
      : 'bun run build && bun run dist/server/entry.mjs',
    url: `${baseURL}/api/health/readiness`,
    timeout: 180_000,
    reuseExistingServer: !isCI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ASTRO_ADAPTER: 'bun',
      HOST,
      PORT: String(PORT),
      APP_BASE_URL: baseURL,
      ...(DATABASE_URL ? { DATABASE_URL } : {}),
      REDIS_URL,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'e2e-secret-e2e-secret-e2e-secret-e2e!!',
      LOG_LEVEL: 'warn',
    },
  },
})
