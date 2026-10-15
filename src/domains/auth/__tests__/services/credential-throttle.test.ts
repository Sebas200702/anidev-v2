/**
 * Tests for credential throttle lockout.
 *
 * @module domains/auth/__tests__/services/credential-throttle
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { incr, expire, ttl, exists, set, del } = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  exists: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))
vi.mock('@lib/cache/client', () => ({
  redis: { incr, expire, ttl, exists, set, del },
}))

const {
  checkCredentialLockout,
  recordCredentialFailure,
  clearCredentialFailures,
} = await import('@auth/services/credential-throttle')

beforeEach(() => {
  vi.clearAllMocks()
  ttl.mockResolvedValue(-2)
  exists.mockResolvedValue(0)
})

describe('credential throttle', () => {
  it('locks per-email regardless of source IP', async () => {
    ttl.mockImplementation(async (key: string) =>
      String(key).includes('email:victim@example.com') ? 600 : -2
    )
    const result = await checkCredentialLockout('1.2.3.4', 'victim@example.com')
    expect(result.locked).toBe(true)
    expect(result.retryAfter).toBe(600)
  })

  it('records failures and engages lockout at threshold', async () => {
    incr.mockResolvedValue(5)
    await recordCredentialFailure('1.2.3.4', 'victim@example.com')
    expect(set).toHaveBeenCalled()
  })

  it('clears failure counters on success', async () => {
    await clearCredentialFailures('1.2.3.4', 'victim@example.com')
    expect(del).toHaveBeenCalled()
  })

  it('fails open when redis is down', async () => {
    ttl.mockRejectedValue(new Error('down'))
    incr.mockRejectedValue(new Error('down'))
    const result = await checkCredentialLockout('1.2.3.4', 'a@b.c')
    expect(result.locked).toBe(false)
    await expect(
      recordCredentialFailure('1.2.3.4', 'a@b.c')
    ).resolves.toBeUndefined()
  })
})
