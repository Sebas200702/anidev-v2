/**
 * Route tests for the Google sign-in, callback and link endpoints.
 *
 * @module pages/api/auth/__tests__/google-routes
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'http://localhost:4321',
  },
}))

const m = vi.hoisted(() => ({
  start: vi.fn(),
  callback: vi.fn(),
  link: vi.fn(),
}))
vi.mock('@auth/services/google-sign-in', () => ({ googleSignInService: m }))

const { GET: startRoute } = await import('../sign-in/google')
const { GET: callbackRoute } = await import('../callback/google')
const { GET: linkRoute } = await import('../link/google')

const redirect = new Response(null, {
  status: 302,
  headers: { Location: '/x' },
})
const ctx = (user: unknown = null) =>
  ({
    request: new Request('http://localhost/api/auth/x'),
    locals: { user, session: null },
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  m.start.mockResolvedValue(redirect)
  m.callback.mockResolvedValue(redirect)
  m.link.mockResolvedValue(redirect)
})

describe('Google auth routes', () => {
  it('passes the start and callback redirects through', async () => {
    expect((await startRoute(ctx())).status).toBe(302)
    expect((await callbackRoute(ctx())).status).toBe(302)
  })

  it('requires a session to link', async () => {
    const res = await linkRoute(ctx())
    expect(res.status).toBe(401)
    expect(m.link).not.toHaveBeenCalled()
  })

  it('links for a signed-in user', async () => {
    const res = await linkRoute(ctx({ id: 'u1' }))
    expect(res.status).toBe(302)
    expect(m.link).toHaveBeenCalled()
  })
})
