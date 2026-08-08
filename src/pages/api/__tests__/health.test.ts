/**
 * Tests for the public health check route.
 *
 * @module pages/api/__tests__/health
 * @remarks
 * `src/config/env.ts` validates eagerly at import, so this test mocks it with
 * `vi.mock('@config/env')` (the runner does not load `.env`). The handler under
 * test is the raw `GET` route from {@link module:pages/api/health}; it is
 * invoked directly with a minimal `APIContext` and the response parsed as JSON.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

const sentryMock = vi.hoisted(() => ({
  captureMessage: vi.fn(),
}))

vi.mock('@sentry/astro', () => sentryMock)

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    SENTRY_DSN: undefined,
  },
}))

import { logger } from '@utils/logger-util'
import { GET } from '../health'

const createContext = () =>
  ({
    request: new Request('http://localhost:4321/api/health'),
    params: {},
  }) as Parameters<typeof GET>[0]

beforeEach(() => {
  vi.restoreAllMocks()
  sentryMock.captureMessage.mockClear()
})

describe('GET /api/health', () => {
  it('responds 200 with the standard success envelope', async () => {
    const response = await GET(createContext())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: { status: 'ok' },
      status: 200,
    })
  })

  it('emits an info-level log on each request', async () => {
    const infoSpy = vi.spyOn(logger, 'info')

    await GET(createContext())

    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy.mock.calls[0][0]).toEqual({ route: '/api/health' })
  })

  it('emits an explicit Sentry event on each request', async () => {
    await GET(createContext())

    expect(sentryMock.captureMessage).toHaveBeenCalledTimes(1)
    expect(sentryMock.captureMessage).toHaveBeenCalledWith('Health check')
  })
})
