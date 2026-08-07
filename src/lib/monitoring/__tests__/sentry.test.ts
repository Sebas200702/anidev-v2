/**
 * Tests for monitoring log-capture configuration in {@link module:lib/monitoring/sentry}.
 *
 * @module lib/monitoring/__tests__/sentry
 * @remarks
 * `sentry.ts` computes `isEnabled` from `env.SENTRY_DSN` at module load, so each
 * case stubs the env, resets modules, re-imports, and asserts on the SDK init
 * call. The SDKs (`@sentry/node`, `@sentry/astro`) and pino integration are
 * mocked to observe that logging is enabled and the pino bridge is wired when a
 * DSN is present, while calls no-op (never invoke the SDK) when it is absent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sentryNodeInit = vi.fn()
const sentryAstroInit = vi.fn()
const sentryNodePino = vi.fn(() => ({ name: 'Pino' }))
const sentryAstroPino = vi.fn(() => ({ name: 'Pino' }))

vi.mock('@sentry/node', () => ({
  init: sentryNodeInit,
  pinoIntegration: sentryNodePino,
}))

vi.mock('@sentry/astro', () => ({
  init: sentryAstroInit,
  pinoIntegration: sentryAstroPino,
}))

const baseEnv = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/anidev',
  REDIS_URL: 'redis://localhost:6379',
  SENTRY_DSN: undefined,
  APP_BASE_URL: 'http://localhost:4321',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  LOG_LEVEL: 'info',
}

async function loadSentry(hasDsn: boolean) {
  vi.resetModules()
  vi.stubEnv('SENTRY_DSN', hasDsn ? 'http://key@localhost:8080/1' : '')
  for (const [key, value] of Object.entries(baseEnv)) {
    if (key === 'SENTRY_DSN') continue
    vi.stubEnv(key, String(value))
  }
  return import('@lib/monitoring/sentry')
}

beforeEach(() => {
  sentryNodeInit.mockClear()
  sentryAstroInit.mockClear()
  sentryNodePino.mockClear()
  sentryAstroPino.mockClear()
})

describe('monitoring log capture', () => {
  it('does not initialize the SDKs when SENTRY_DSN is absent', async () => {
    const { initServerSentry, initAstroSentry } = await loadSentry(false)

    initServerSentry()
    initAstroSentry()

    expect(sentryNodeInit).not.toHaveBeenCalled()
    expect(sentryAstroInit).not.toHaveBeenCalled()
  })

  it('enables pino log capture in the Node SDK when a DSN is set', async () => {
    const { initServerSentry } = await loadSentry(true)

    initServerSentry()

    expect(sentryNodeInit).toHaveBeenCalledWith(
      expect.objectContaining({
        enableLogs: true,
        integrations: expect.arrayContaining([{ name: 'Pino' }]),
        dsn: 'http://key@localhost:8080/1',
      })
    )
    expect(sentryNodePino).toHaveBeenCalled()
  })

  it('enables pino log capture in the Astro SDK when a DSN is set', async () => {
    const { initAstroSentry } = await loadSentry(true)

    initAstroSentry()

    expect(sentryAstroInit).toHaveBeenCalledWith(
      expect.objectContaining({
        enableLogs: true,
        integrations: expect.arrayContaining([{ name: 'Pino' }]),
        dsn: 'http://key@localhost:8080/1',
      })
    )
    expect(sentryAstroPino).toHaveBeenCalled()
  })
})
