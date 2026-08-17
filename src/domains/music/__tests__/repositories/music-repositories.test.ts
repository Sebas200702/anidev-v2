/**
 * Unit tests for the music domain repositories.
 *
 * @module domains/music/__tests__/repositories/music-repositories
 * @remarks
 * The Drizzle client is mocked with a chainable stub. Covers query methods, empty-id guards, the
 * count fallback, `buildMusicListFilters` branches (type + query), and each `dbError` catch.
 * Follows the repo TDD/unit-test layout.
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

const { select } = vi.hoisted(() => ({ select: vi.fn() }))
vi.mock('@db/client', () => ({ db: { select } }))

const { animeMusicRepository } = await import('@music/repositories/anime-music')
const { musicRepository } = await import('@music/repositories/music')
const { musicListRepository } = await import('@music/repositories/music-list')
const { musicRelationRepository } = await import(
  '@music/repositories/music-relation'
)
const { musicVersionRepository } = await import(
  '@music/repositories/music-version'
)

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
})

describe('animeMusicRepository', () => {
  it('returns music rows joined by anime id', async () => {
    select.mockReturnValue(chainResolving([{ id: 1, title: 'X', type: 'OP' }]))
    expect(await animeMusicRepository.findMusicByAnimeId(1)).toEqual([
      { id: 1, title: 'X', type: 'OP' },
    ])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeMusicRepository.findMusicByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('musicRepository', () => {
  it('returns the first row, many rows, and by type', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    expect(await musicRepository.getMusicById(1)).toEqual({ id: 1 })
    expect(await musicRepository.findManyByIds([1])).toEqual([{ id: 1 }])
    expect(await musicRepository.findByType('OP')).toEqual([{ id: 1 }])
  })

  it('short-circuits findManyByIds for empty ids', async () => {
    expect(await musicRepository.findManyByIds([])).toEqual([])
    expect(select).not.toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(musicRepository.getMusicById(1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(musicRepository.findManyByIds([1])).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(musicRepository.findByType('OP')).rejects.toBeInstanceOf(
      InfraError
    )
  })
})

describe('musicListRepository', () => {
  it('lists with type and query filters applied', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    const rows = await musicListRepository.getMusicList({
      page: 1,
      limit: 10,
      type: 'OP',
      query: 'unravel',
    } as never)
    expect(rows).toEqual([{ id: 1 }])
  })

  it('returns the count with a zero fallback', async () => {
    select.mockReturnValue(chainResolving([{ count: 4 }]))
    expect(await musicListRepository.getMusicListCount({})).toBe(4)

    select.mockReturnValue(chainResolving([]))
    expect(await musicListRepository.getMusicListCount({})).toBe(0)
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      musicListRepository.getMusicList({ page: 1, limit: 10 } as never)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      musicListRepository.getMusicListCount({})
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('musicRelationRepository', () => {
  it('returns artists by single and multiple music ids', async () => {
    select.mockReturnValue(chainResolving([{ id: 1, name: 'A', malId: 9 }]))
    expect(await musicRelationRepository.findArtistsByMusicId(1)).toEqual([
      { id: 1, name: 'A', malId: 9 },
    ])
    expect(await musicRelationRepository.findArtistsByMusicIds([1])).toEqual([
      { id: 1, name: 'A', malId: 9 },
    ])
  })

  it('short-circuits findArtistsByMusicIds for empty ids', async () => {
    expect(await musicRelationRepository.findArtistsByMusicIds([])).toEqual([])
    expect(select).not.toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      musicRelationRepository.findArtistsByMusicId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      musicRelationRepository.findArtistsByMusicIds([1])
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('musicVersionRepository', () => {
  it('returns versions and resolutions', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    expect(await musicVersionRepository.findVersionsByMusicId(1)).toEqual([
      { id: 1 },
    ])
    expect(await musicVersionRepository.findResolutionsByVersionId(1)).toEqual([
      { id: 1 },
    ])
    expect(
      await musicVersionRepository.findResolutionsByVersionIds([1])
    ).toEqual([{ id: 1 }])
  })

  it('short-circuits findResolutionsByVersionIds for empty ids', async () => {
    expect(
      await musicVersionRepository.findResolutionsByVersionIds([])
    ).toEqual([])
    expect(select).not.toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      musicVersionRepository.findVersionsByMusicId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      musicVersionRepository.findResolutionsByVersionId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      musicVersionRepository.findResolutionsByVersionIds([1])
    ).rejects.toBeInstanceOf(InfraError)
  })
})
