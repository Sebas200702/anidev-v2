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

const { mangaListRepository } = await import('@manga/repositories/manga-list')
const { mangaDetailsRepository } = await import(
  '@manga/repositories/manga-details'
)

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
  selectDistinct.mockReturnValue(chainResolving([]))
})

describe('mangaListRepository', () => {
  it('returns rows for getMangaList', async () => {
    selectDistinct.mockReturnValue(chainResolving([{ manga: { malId: 1 } }]))
    const rows = await mangaListRepository.getMangaList({
      page: 1,
      limit: 10,
      parentalVariant: 'full',
    } as any)
    expect(Array.isArray(rows)).toBe(true)
  })

  it('returns count for countMangaList', async () => {
    select.mockReturnValue(chainResolving([{ value: 3 }]))
    const total = await mangaListRepository.countMangaList({
      page: 1,
      limit: 10,
      parentalVariant: 'full',
    } as any)
    expect(total).toBe(3)
  })

  it('wraps errors', async () => {
    selectDistinct.mockImplementation(throwOnQuery)
    await expect(
      mangaListRepository.getMangaList({ page: 1, limit: 10 } as any)
    ).rejects.toBeInstanceOf(InfraError)
    select.mockImplementation(throwOnQuery)
    await expect(
      mangaListRepository.countMangaList({ page: 1, limit: 10 } as any)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('mangaDetailsRepository', () => {
  it('returns work or null', async () => {
    select.mockReturnValue(chainResolving([{ manga: { malId: 1 } }]))
    const work = await mangaDetailsRepository.getManga(1)
    expect(work).toEqual({ malId: 1 })
  })

  it('returns null when no rows', async () => {
    select.mockReturnValue(chainResolving([]))
    const work = await mangaDetailsRepository.getManga(1)
    expect(work).toBeNull()
  })

  it('returns arrays for taxonomy/cast/staff/publishers/related/links', async () => {
    select.mockReturnValue(chainResolving([]))
    expect(await mangaDetailsRepository.getGenres(1)).toEqual([])
    expect(await mangaDetailsRepository.getThemes(1)).toEqual([])
    expect(await mangaDetailsRepository.getDemographics(1)).toEqual([])
    expect(await mangaDetailsRepository.getCharacters(1)).toEqual([])
    expect(await mangaDetailsRepository.getStaff(1)).toEqual([])
    expect(await mangaDetailsRepository.getPublishers(1)).toEqual([])
    expect(await mangaDetailsRepository.getRelated(1)).toEqual([])
    expect(await mangaDetailsRepository.getExternalLinks(1)).toEqual([])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(mangaDetailsRepository.getManga(1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(mangaDetailsRepository.getGenres(1)).rejects.toBeInstanceOf(
      InfraError
    )
  })
})
