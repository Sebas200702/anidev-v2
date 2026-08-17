/**
 * Unit tests for the anime domain repositories.
 *
 * @module domains/anime/__tests__/repositories/anime-repositories
 * @remarks
 * The Drizzle client is mocked with a chainable stub so each repository method is exercised for its
 * success shape (destructure / map / count fallback / empty-id guards) and its `dbError` catch
 * branch, without a real database. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import {
  chainResolving,
  throwOnQuery,
} from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { select, selectDistinct } = vi.hoisted(() => ({
  select: vi.fn(),
  selectDistinct: vi.fn(),
}))
vi.mock('@db/client', () => ({ db: { select, selectDistinct } }))

const { animeRepository } = await import('@anime/repositories/anime')
const { animeCharacterRepository } = await import(
  '@anime/repositories/anime-characters'
)
const { animeExternalRepository } = await import(
  '@anime/repositories/anime-external'
)
const { animeListRepository } = await import('@anime/repositories/anime-list')
const { animeRelationsRepository } = await import(
  '@anime/repositories/anime-relations'
)
const { animeStaffRepository } = await import('@anime/repositories/anime-staff')
const { animeTaxonomyRepository } = await import(
  '@anime/repositories/anime-taxonomy'
)
const { animeTitleRepository } = await import('@anime/repositories/anime-title')
const { characterRepository } = await import('@anime/repositories/character')
const { characterStaffRepository } = await import(
  '@anime/repositories/character-staff'
)
const { staffRepository } = await import('@anime/repositories/staff')

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
  selectDistinct.mockReturnValue(chainResolving([]))
})

describe('animeRepository', () => {
  it('returns the first row for getAnimeByMalId', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1 }]))
    expect(await animeRepository.getAnimeByMalId(1)).toEqual({ malId: 1 })
  })

  it('returns rows for getManyAnimeByMalIds', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1 }, { malId: 2 }]))
    expect(await animeRepository.getManyAnimeByMalIds([1, 2])).toHaveLength(2)
  })

  it('wraps errors as InfraError', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(animeRepository.getAnimeByMalId(1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(
      animeRepository.getManyAnimeByMalIds([1])
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeCharacterRepository', () => {
  it('returns character refs', async () => {
    select.mockReturnValue(chainResolving([{ characterId: 1 }]))
    expect(await animeCharacterRepository.getCharacterRefsByAnimeId(1)).toEqual(
      [{ characterId: 1 }]
    )
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeCharacterRepository.getCharacterRefsByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeExternalRepository', () => {
  it('returns the first external-ids row', async () => {
    select.mockReturnValue(chainResolving([{ animeId: 1 }]))
    expect(await animeExternalRepository.getExternalLinksByAnimeId(1)).toEqual({
      animeId: 1,
    })
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeExternalRepository.getExternalLinksByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeListRepository', () => {
  it('maps distinct rows to anime for getAnimeList', async () => {
    selectDistinct.mockReturnValue(
      chainResolving([{ anime: { malId: 1 } }, { anime: { malId: 2 } }])
    )
    const rows = await animeListRepository.getAnimeList({
      page: 1,
      limit: 10,
    } as never)
    expect(rows).toEqual([{ malId: 1 }, { malId: 2 }])
  })

  it('uses the relevance ranking branch when sorting by relevance with a query', async () => {
    selectDistinct.mockReturnValue(chainResolving([{ anime: { malId: 3 } }]))
    const rows = await animeListRepository.getAnimeList({
      page: 1,
      limit: 10,
      sort: 'relevance',
      query: 'naruto',
    } as never)
    expect(rows).toEqual([{ malId: 3 }])
  })

  it('returns the count with a zero fallback', async () => {
    selectDistinct.mockReturnValue(chainResolving([{ count: 7 }]))
    expect(await animeListRepository.getAnimeListCount({} as never)).toBe(7)

    selectDistinct.mockReturnValue(chainResolving([]))
    expect(await animeListRepository.getAnimeListCount({} as never)).toBe(0)
  })

  it('wraps errors for list and count', async () => {
    selectDistinct.mockImplementation(throwOnQuery)
    await expect(
      animeListRepository.getAnimeList({ page: 1, limit: 10 } as never)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeListRepository.getAnimeListCount({} as never)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeRelationsRepository', () => {
  it('returns relations and related anime data', async () => {
    select.mockReturnValue(chainResolving([{ relatedAnimeId: 2 }]))
    expect(await animeRelationsRepository.getRelatedAnimeByAnimeId(1)).toEqual([
      { relatedAnimeId: 2 },
    ])
    expect(
      await animeRelationsRepository.getAnimeRelatedAnimeDataByAnimeId(1)
    ).toEqual([{ relatedAnimeId: 2 }])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeRelationsRepository.getRelatedAnimeByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeRelationsRepository.getAnimeRelatedAnimeDataByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeStaffRepository', () => {
  it('returns staff refs', async () => {
    select.mockReturnValue(chainResolving([{ staffId: 1 }]))
    expect(await animeStaffRepository.getAnimeStaffByAnimeMalId(1)).toEqual([
      { staffId: 1 },
    ])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeStaffRepository.getAnimeStaffByAnimeMalId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeTaxonomyRepository', () => {
  it('returns genres, demographics, and themes', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1, name: 'Action' }]))
    expect(await animeTaxonomyRepository.getGenresByAnimeId(1)).toHaveLength(1)
    expect(
      await animeTaxonomyRepository.getDemographicsByAnimeId(1)
    ).toHaveLength(1)
    expect(await animeTaxonomyRepository.getThemesByAnimeId(1)).toHaveLength(1)
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeTaxonomyRepository.getGenresByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeTaxonomyRepository.getDemographicsByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeTaxonomyRepository.getThemesByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('animeTitleRepository', () => {
  it('returns title synonyms', async () => {
    select.mockReturnValue(chainResolving([{ id: 1, title: 'X', animeId: 1 }]))
    expect(
      await animeTitleRepository.getTitleSynonymsByAnimeId(1)
    ).toHaveLength(1)
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeTitleRepository.getTitleSynonymsByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('characterRepository', () => {
  it('returns the first row and many rows', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1 }]))
    expect(await characterRepository.getByMalId(1)).toEqual({ malId: 1 })
    expect(await characterRepository.getManyByMalIds([1])).toEqual([
      { malId: 1 },
    ])
  })

  it('short-circuits getManyByMalIds for an empty id list', async () => {
    expect(await characterRepository.getManyByMalIds([])).toEqual([])
    expect(select).not.toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(characterRepository.getByMalId(1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(
      characterRepository.getManyByMalIds([1])
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('characterStaffRepository', () => {
  it('returns voices, chunking id lookups', async () => {
    select.mockReturnValue(chainResolving([{ characterId: 1, staffId: 5 }]))
    expect(await characterStaffRepository.getVoicesByCharacterIds([1])).toEqual(
      [{ characterId: 1, staffId: 5 }]
    )
  })

  it('short-circuits for an empty id list', async () => {
    expect(await characterStaffRepository.getVoicesByCharacterIds([])).toEqual(
      []
    )
    expect(select).not.toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      characterStaffRepository.getVoicesByCharacterIds([1])
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('staffRepository', () => {
  it('returns rows and short-circuits for empty ids', async () => {
    select.mockReturnValue(chainResolving([{ malId: 5 }]))
    expect(await staffRepository.getManyByMalIds([5])).toEqual([{ malId: 5 }])
    expect(await staffRepository.getManyByMalIds([])).toEqual([])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(staffRepository.getManyByMalIds([1])).rejects.toBeInstanceOf(
      InfraError
    )
  })
})
