/**
 * Cache-key tests for the anime list cache.
 *
 * @module domains/anime/__tests__/cache/anime-list-cache
 * @remarks
 * Proves the parental floor is safe: `safe`/`full` never share a cache entry,
 * the key is a pure function of the normalized filters (no per-call or per-user
 * entropy), so results are never keyed by — or leaked across — users.
 */
import { describe, expect, it, vi } from 'vitest'
import type { AnimeFilters } from '@anime/types'

type ParentalVariant = NonNullable<AnimeFilters['parentalVariant']>

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))
vi.mock('@lib/cache', () => ({ cacheGet: vi.fn(), cacheSet: vi.fn() }))

const { animeListCache } = await import('@anime/cache/anime-list')

const filters = (parentalVariant: ParentalVariant): AnimeFilters => ({
  page: 1,
  limit: 10,
  genre: ['Action'],
  parentalVariant,
})

describe('animeListCache.key — parental variant isolation', () => {
  it('produces distinct keys per parental variant for the same filter set', () => {
    expect(animeListCache.key(filters('safe'))).not.toBe(
      animeListCache.key(filters('full'))
    )
  })

  it('is deterministic — identical filters always yield the same key', () => {
    expect(animeListCache.key(filters('safe'))).toBe(
      animeListCache.key(filters('safe'))
    )
  })

  it('yields at most the safe/full variants for one filter set', () => {
    const keys = new Set(
      (['safe', 'full', 'safe', 'full'] as ParentalVariant[]).map((v) =>
        animeListCache.key(filters(v))
      )
    )
    expect(keys.size).toBe(2)
  })

  it('is fully determined by the filters — no user identifier embedded', () => {
    const safe = filters('safe')
    const key = animeListCache.key(safe)
    // The key is `${prefix}:${JSON.stringify(filters)}`; reconstructing it from
    // the same filters must match exactly, so no hidden per-user entropy exists.
    expect(key.endsWith(JSON.stringify(safe))).toBe(true)
    expect(key).not.toMatch(/user/i)
  })
})
