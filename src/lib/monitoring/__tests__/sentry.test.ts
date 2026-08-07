/**
 * Tests for monitoring log-capture configuration in {@link module:lib/monitoring/sentry}.
 *
 * @module lib/monitoring/__tests__/sentry
 * @remarks
 * `sentry.ts` computes `isEnabled` from `env.SENTRY_DSN` at module load. The env
 * is mocked with {@link module:@config/env} so each case swaps `SENTRY_DSN`, re-imports
 * the module, and asserts on the SDK init call. The SDKs (`@sentry/node`,
 * `@sentry/astro`) and pino integration are mocked to observe that logging is
 * enabled and the pino bridge is wired when a DSN is present, while calls no-op
 * (never invoke the SDK) when it is absent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sentryNodeInit = vi.fn()
const sentryAstroInit = vi.fn()
const sentryNodePino = vi.fn(() => ({ name: 'Pino' }))
const sentryAstroPino = vi.fn(() => ({ name: 'Pino' }))
const sentryBoundary = vi.fn((component) => component)

vi.mock('@sentry/node', () => ({
  init: sentryNodeInit,
  pinoIntegration: sentryNodePino,
}))

vi.mock('@sentry/astro', () => ({
  init: sentryAstroInit,
  pinoIntegration: sentryAstroPino,
}))

vi.mock('@sentry/react', () => ({
  withErrorBoundary: sentryBoundary,
}))

const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/anidev',
  REDIS_URL: 'redis://localhost:6379',
  SENTRY_DSN: undefined as string | undefined,
  APP_BASE_URL: 'http://localhost:4321',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  LOG_LEVEL: 'info',
}))

vi.mock('@config/env', () => ({ env: mockEnv }))

async function loadSentry() {
  vi.resetModules()
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
    mockEnv.SENTRY_DSN = ''
    const { initServerSentry, initAstroSentry } = await loadSentry()

    initServerSentry()
    initAstroSentry()

    expect(sentryNodeInit).not.toHaveBeenCalled()
    expect(sentryAstroInit).not.toHaveBeenCalled()
  })

  it('enables pino log capture in the Node SDK when a DSN is set', async () => {
    mockEnv.SENTRY_DSN = 'http://key@localhost:8080/1'
    const { initServerSentry } = await loadSentry()

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
    mockEnv.SENTRY_DSN = 'http://key@localhost:8080/1'
    const { initAstroSentry } = await loadSentry()

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
