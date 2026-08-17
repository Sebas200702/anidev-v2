/**
 * Route tests for the auth endpoints under `/api/auth`.
 *
 * @module pages/api/auth/__tests__/auth-routes
 * @remarks
 * Drives the real validation + error-handling wrappers with mocked auth services. Covers login
 * (200 + forwarded headers), the 400 for an invalid body, register (201), and the session/logout
 * GET/POST wiring. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    LOG_LEVEL: 'silent',
  },
}))

const { login, register, getSession, logout } = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  getSession: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@auth/services', () => ({
  credentialsService: { login, register },
  sessionService: { getSession, logout },
}))

const { POST: loginRoute } = await import('../login')
const { POST: registerRoute } = await import('../register')
const { GET: sessionRoute } = await import('../session')
const { POST: logoutRoute } = await import('../logout')

type RouteFn = (ctx: unknown) => Promise<Response>

const post = (route: unknown, body: unknown) =>
  (route as RouteFn)({
    request: new Request('http://localhost:4321/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params: {},
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/auth/login', () => {
  it('returns 200 and forwards the service headers', async () => {
    login.mockResolvedValue({
      data: { user: 1 },
      headers: new Headers({ 'set-cookie': 'session=1' }),
    })

    const res = await post(loginRoute, {
      email: 'user@example.com',
      password: 'password123',
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ user: 1 })
    expect(res.headers.get('set-cookie')).toBe('session=1')
    expect(login).toHaveBeenCalled()
  })

  it('rejects an invalid body with 400', async () => {
    const res = await post(loginRoute, { email: 'nope', password: 'x' })
    expect(res.status).toBe(400)
    expect(login).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/register', () => {
  it('returns 201 on success', async () => {
    register.mockResolvedValue({ data: { id: 9 }, headers: new Headers() })

    const res = await post(registerRoute, {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    })

    expect(res.status).toBe(201)
    expect(register).toHaveBeenCalled()
  })
})

describe('GET /api/auth/session', () => {
  it('returns the current session', async () => {
    getSession.mockResolvedValue({ user: { id: 1 } })

    const res = await (sessionRoute as RouteFn)({
      request: new Request('http://localhost:4321/api/auth/session'),
      params: {},
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ user: { id: 1 } })
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 200 and forwards cleared cookie headers', async () => {
    logout.mockResolvedValue({
      data: { ok: true },
      headers: new Headers({ 'set-cookie': 'session=;Max-Age=0' }),
    })

    const res = await (logoutRoute as RouteFn)({
      request: new Request('http://localhost:4321/api/auth/logout', {
        method: 'POST',
      }),
      params: {},
    })

    expect(res.status).toBe(200)
    expect(logout).toHaveBeenCalled()
  })
})
