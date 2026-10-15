/**
 * Tests for the request session middleware (`onRequest`).
 *
 * @module middleware/__tests__/auth-middleware
 * @remarks
 * Mocks the `astro:middleware` virtual module, the public-route allowlist, the actor resolver, and
 * Sentry init. Covers the login bypass, the no-cookie fast path, actor population, and the
 * clear-on-unauthenticated-private-route rule. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('astro:middleware', () => ({
  defineMiddleware: (fn: unknown) => fn,
}))
vi.mock('@lib/monitoring/sentry', () => ({ initAstroSentry: vi.fn() }))
vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgres://test:test@localhost/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
  },
}))

const { resolveAuthActor, isPublicRoute } = vi.hoisted(() => ({
  resolveAuthActor: vi.fn(),
  isPublicRoute: vi.fn(),
}))
const { redis } = vi.hoisted(() => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
    get: vi.fn().mockResolvedValue(null),
    connect: vi.fn().mockResolvedValue(undefined),
  },
}))
vi.mock('@lib/cache/client', () => ({ redis }))

vi.mock('@auth/middleware', () => ({ resolveAuthActor }))
vi.mock('@config/public-routes', () => ({ isPublicRoute }))

const { loggerInfo } = vi.hoisted(() => ({ loggerInfo: vi.fn() }))
vi.mock('@utils/logger-util', () => ({
  logger: { info: loggerInfo, warn: vi.fn(), error: vi.fn() },
}))

import { onRequest } from '../auth-middleware'

type Middleware = (ctx: unknown, next: () => unknown) => Promise<unknown>

const next = vi.fn(() => 'next-result')

const ctx = (pathname: string, cookie: string | null) => ({
  url: new URL(`http://localhost:4321${pathname}`),
  request: new Request(`http://localhost:4321${pathname}`, {
    headers: cookie ? { cookie } : {},
  }),
  locals: {} as Record<string, unknown>,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('onRequest', () => {
  it('clears the session and skips resolution on login', async () => {
    const context = ctx('/api/auth/login', 'session_token=abc')

    await (onRequest as Middleware)(context, next)

    expect(context.locals.user).toBeNull()
    expect(context.locals.session).toBeNull()
    expect(resolveAuthActor).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('clears the session when there is no auth cookie', async () => {
    const context = ctx('/api/anime', null)

    await (onRequest as Middleware)(context, next)

    expect(context.locals.user).toBeNull()
    expect(resolveAuthActor).not.toHaveBeenCalled()
  })

  it('populates locals from the resolved actor', async () => {
    resolveAuthActor.mockResolvedValue({
      user: { id: 1 },
      session: { id: 's' },
    })
    const context = ctx('/dashboard', 'session_token=abc')

    await (onRequest as Middleware)(context, next)

    expect(context.locals.user).toEqual({ id: 1 })
    expect(context.locals.session).toEqual({ id: 's' })
  })

  it('clears the session for an unauthenticated private route', async () => {
    resolveAuthActor.mockResolvedValue({ user: null, session: null })
    isPublicRoute.mockReturnValue(false)
    const context = ctx('/dashboard', 'session_data=abc')

    await (onRequest as Middleware)(context, next)

    expect(isPublicRoute).toHaveBeenCalledWith('/dashboard')
    expect(context.locals.user).toBeNull()
  })
})

describe('onRequest access logging', () => {
  it('emits one structured access line correlated by requestId', async () => {
    resolveAuthActor.mockResolvedValue({ user: null, session: null })
    isPublicRoute.mockReturnValue(true)
    const context = ctx('/api/anime', null)
    const response = new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    })
    const nextWithResponse = vi.fn(async () => response)

    const result = (await (onRequest as Middleware)(
      context,
      nextWithResponse
    )) as Response

    expect(context.locals.requestId).toEqual(expect.any(String))
    expect(result.headers.get('x-request-id')).toBe(context.locals.requestId)
    expect(loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: context.locals.requestId,
        method: 'GET',
        route: '/api/anime',
        status: 200,
        actor: 'anonymous',
        durationMs: expect.any(Number),
      }),
      'request'
    )
  })

  it('marks authenticated actors as user', async () => {
    resolveAuthActor.mockResolvedValue({
      user: { id: 1 },
      session: { id: 's' },
    })
    const context = ctx('/dashboard', 'session_token=abc')

    await (onRequest as Middleware)(context, next)

    expect(loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ actor: 'user' }),
      'request'
    )
  })
})
