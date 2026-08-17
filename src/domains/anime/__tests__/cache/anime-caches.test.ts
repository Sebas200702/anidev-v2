/**
 * Tests for the anime full/character/staff caches.
 *
 * @module domains/anime/__tests__/cache/anime-caches
 * @remarks
 * Covers the deterministic key format and delegation of `get`/`set` to the shared cache client with
 * the configured TTLs. `@lib/cache` is mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet }))

const { animeFullCache } = await import('@anime/cache/anime-full')
const { animeCharacterCache } = await import('@anime/cache/anime-character')
const { animeStaffCache } = await import('@anime/cache/anime-staff')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeFullCache', () => {
  it('builds a deterministic key and reads/writes through the client', async () => {
    const key = animeFullCache.key(5114)
    expect(key).toContain('5114')

    cacheGet.mockResolvedValue({ malId: 5114 })
    await expect(animeFullCache.get(5114)).resolves.toEqual({ malId: 5114 })
    expect(cacheGet).toHaveBeenCalledWith(key)

    await animeFullCache.set(5114, { malId: 5114 } as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      { malId: 5114 },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})

describe('animeCharacterCache', () => {
  it('delegates get/set with the character key', async () => {
    const key = animeCharacterCache.key(1)
    await animeCharacterCache.get(1)
    expect(cacheGet).toHaveBeenCalledWith(key)

    await animeCharacterCache.set(1, [] as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      [],
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})

describe('animeStaffCache', () => {
  it('delegates get/set with the staff key', async () => {
    const key = animeStaffCache.key(1)
    await animeStaffCache.get(1)
    expect(cacheGet).toHaveBeenCalledWith(key)

    await animeStaffCache.set(1, [] as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      [],
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})
