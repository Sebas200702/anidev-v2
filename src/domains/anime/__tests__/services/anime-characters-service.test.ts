/**
 * Tests for {@link animeCharacterService}.
 *
 * @module domains/anime/__tests__/services/anime-characters-service
 * @remarks
 * Exercises the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`).
 * Covers the ref → character/voice → staff fan-out and de-duplication of staff ids before the
 * mapper call. Follows the repo TDD/unit-test layout.
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
vi.mock('@anime/cache/anime-character', () => ({
  animeCharacterCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const { getCharacterRefs, getCharacters, getVoices, getStaff, mapCharacters } =
  vi.hoisted(() => ({
    getCharacterRefs: vi.fn(),
    getCharacters: vi.fn(),
    getVoices: vi.fn(),
    getStaff: vi.fn(),
    mapCharacters: vi.fn(),
  }))

vi.mock('@anime/repositories/anime-characters', () => ({
  animeCharacterRepository: { getCharacterRefsByAnimeId: getCharacterRefs },
}))
vi.mock('@anime/repositories/character', () => ({
  characterRepository: { getManyByMalIds: getCharacters },
}))
vi.mock('@anime/repositories/character-staff', () => ({
  characterStaffRepository: { getVoicesByCharacterIds: getVoices },
}))
vi.mock('@anime/repositories/staff', () => ({
  staffRepository: { getManyByMalIds: getStaff },
}))
vi.mock('@anime/mappers/anime-character', () => ({
  mapAnimeCharacters: mapCharacters,
}))

import { animeCharacterService } from '@anime/services/anime-characters'

describe('animeCharacterService.getAnimeCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fans out by ids and dedupes staff before mapping', async () => {
    getCharacterRefs.mockResolvedValue([
      { characterId: 100 },
      { characterId: 200 },
    ])
    getCharacters.mockResolvedValue([{ malId: 100 }])
    getVoices.mockResolvedValue([
      { characterId: 100, staffId: 500 },
      { characterId: 200, staffId: 500 },
    ])
    getStaff.mockResolvedValue([{ malId: 500 }])
    mapCharacters.mockReturnValue(['character'])

    const { value } = await animeCharacterService.getAnimeCharacters(5114)

    expect(getCharacters).toHaveBeenCalledWith([100, 200])
    expect(getVoices).toHaveBeenCalledWith([100, 200])
    expect(getStaff).toHaveBeenCalledWith([500])
    expect(value).toEqual(['character'])
  })
})
