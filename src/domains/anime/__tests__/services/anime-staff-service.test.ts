/**
 * Tests for {@link animeStaffService}.
 *
 * @module domains/anime/__tests__/services/anime-staff-service
 * @remarks
 * Exercises the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`).
 * Covers ref → staff fan-out and the empty-staff result. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: {
    key: string
    staleKey: string
    getCache: () => Promise<unknown>
    getStaleCache: (k: string) => Promise<unknown>
    setCache: (k: string, v: unknown) => Promise<unknown>
    setStaleCache: (k: string, v: unknown) => Promise<unknown>
    compute: () => Promise<unknown>
  }) => {
    await opts.getCache()
    await opts.getStaleCache(opts.staleKey)
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    await opts.setStaleCache(opts.staleKey, value)
    return { value, isStale: false }
  },
}))
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Stale: 1, Long: 3 } }))
vi.mock('@anime/cache/anime-staff', () => ({
  animeStaffCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const { getAnimeStaffRefs, getStaff, mapStaff } = vi.hoisted(() => ({
  getAnimeStaffRefs: vi.fn(),
  getStaff: vi.fn(),
  mapStaff: vi.fn(),
}))

vi.mock('@anime/repositories/anime-staff', () => ({
  animeStaffRepository: { getAnimeStaffByAnimeMalId: getAnimeStaffRefs },
}))
vi.mock('@anime/repositories/staff', () => ({
  staffRepository: { getManyByMalIds: getStaff },
}))
vi.mock('@anime/mappers/anime-staff', () => ({ mapAnimeStaff: mapStaff }))

import { animeStaffService } from '@anime/services/anime-staff'

describe('animeStaffService.getAnimeStaff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves staff by ref ids and maps them', async () => {
    getAnimeStaffRefs.mockResolvedValue([{ staffId: 1 }, { staffId: 2 }])
    getStaff.mockResolvedValue([{ malId: 1 }, { malId: 2 }])
    mapStaff.mockReturnValue(['staff'])

    const { value } = await animeStaffService.getAnimeStaff(20)

    expect(getStaff).toHaveBeenCalledWith([1, 2])
    expect(mapStaff).toHaveBeenCalledWith({
      staff: [{ malId: 1 }, { malId: 2 }],
      animeStaff: [{ staffId: 1 }, { staffId: 2 }],
    })
    expect(value).toEqual(['staff'])
  })

  it('returns whatever the mapper produces for empty refs', async () => {
    getAnimeStaffRefs.mockResolvedValue([])
    getStaff.mockResolvedValue([])
    mapStaff.mockReturnValue([])

    const { value } = await animeStaffService.getAnimeStaff(20)

    expect(getStaff).toHaveBeenCalledWith([])
    expect(value).toEqual([])
  })
})
