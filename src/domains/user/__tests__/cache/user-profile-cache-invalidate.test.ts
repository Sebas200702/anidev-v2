/**
 * Tests for {@link userProfileCache.invalidate}.
 *
 * @module domains/user/__tests__/cache/user-profile-cache-invalidate
 * @remarks
 * Verifies cache invalidation delegates to `cacheDel` with the same key
 * the cache reads/writes use, so write paths can bust stale profile entries.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET:
      'test-secret-test-secret-test-secret-test-secret',
    SENTRY_DSN: undefined,
    LOG_LEVEL: 'silent',
  },
}))

const { delMock } = vi.hoisted(() => ({
  delMock: vi.fn(),
}))

vi.mock('@lib/cache/cache-primitives', () => ({
  cacheDel: delMock,
}))

import { userProfileCache } from '@user/cache'

describe('userProfileCache.invalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to cacheDel with the same key the cache reads/writes use', async () => {
    await userProfileCache.invalidate('user-123')

    expect(delMock).toHaveBeenCalledWith('user:profile:user-123')
  })
})
