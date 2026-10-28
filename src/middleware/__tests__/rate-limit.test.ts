/**
 * Tests for the rate-limit service.
 *
 * @module middleware/rate-limit/service-test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { incr, expire, ttl, get } = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  get: vi.fn(),
}))
vi.mock('@lib/cache/client', () => ({
  redis: { incr, expire, ttl, get },
}))

const { enforceRateLimit, resolveRateLimit } = await import(
  '@middleware/rate-limit'
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enforceRateLimit', () => {
  it('allows requests under threshold and sets expiry on first hit', async () => {
    incr.mockResolvedValue(1)
    get.mockResolvedValue('1')
    const result = await enforceRateLimit(['rl:gen:1.2.3.4'], 60)
    expect(result.allowed).toBe(true)
    expect(expire).toHaveBeenCalled()
  })

  it('blocks after threshold with Retry-After from TTL', async () => {
    incr.mockResolvedValue(61)
    ttl.mockResolvedValue(120)
    get.mockResolvedValue('61')
    const result = await enforceRateLimit(['rl:gen:1.2.3.4'], 60)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBe(120)
  })

  it('falls back to window seconds when TTL is missing', async () => {
    incr.mockResolvedValue(61)
    ttl.mockResolvedValue(-2)
    get.mockResolvedValue('61')
    const result = await enforceRateLimit(['rl:gen:1.2.3.4'], 60)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBe(60)
  })

  it('fails open when cache is down', async () => {
    incr.mockRejectedValue(new Error('down'))
    const result = await enforceRateLimit(['rl:gen:1.2.3.4'], 60)
    expect(result.allowed).toBe(true)
  })
})

describe('resolveRateLimit', () => {
  it('returns null for non-limited paths', () => {
    expect(resolveRateLimit('/', '1.2.3.4')).toBeNull()
    expect(resolveRateLimit('/dashboard', '1.2.3.4')).toBeNull()
  })

  it('resolves api, media, and auth limits', () => {
    expect(resolveRateLimit('/api/anime', '1.2.3.4')?.limit).toBe(60)
    expect(resolveRateLimit('/media/x', '1.2.3.4')?.limit).toBe(60)
    expect(resolveRateLimit('/api/auth/login', '1.2.3.4')?.limit).toBe(10)
  })
})

describe('resolveRateLimit uploads', () => {
  it.each(['/api/user/u1/avatar', '/api/user/u1/banner'])(
    'puts PUT %s in the upload bucket (10/min)',
    (pathname) => {
      expect(resolveRateLimit(pathname, '1.2.3.4', 'PUT')).toEqual({
        keys: ['rl:upload:1.2.3.4'],
        limit: 10,
      })
    }
  )

  it.each([
    ['/api/user/u1/avatar', 'DELETE'],
    ['/api/user/u1/avatar/character', 'PUT'],
    ['/api/user/u1/banner/anime', 'PUT'],
    ['/api/user/u1', 'PUT'],
  ])('keeps %s %s in the general bucket', (pathname, method) => {
    expect(resolveRateLimit(pathname, '1.2.3.4', method)?.keys).toEqual([
      'rl:gen:1.2.3.4',
    ])
  })
})
