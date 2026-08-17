/**
 * Unit tests for the media domain repositories.
 *
 * @module domains/media/__tests__/repositories/media-repositories
 * @remarks
 * The Drizzle client is mocked with a chainable stub. Covers the row-mapping shapes (episode/staff),
 * the music version/resolution filtering + null-src drop, empty-id guards, and each `dbError` catch
 * branch. Follows the repo TDD/unit-test layout.
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

const { animeMediaRepository } = await import('@media/repositories/anime-media')
const { characterMediaRepository } = await import(
  '@media/repositories/character-media'
)
const { episodeMediaRepository } = await import(
  '@media/repositories/episode-media'
)
const { musicMediaRepository } = await import('@media/repositories/music-media')
const { staffMediaRepository } = await import('@media/repositories/staff-media')

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
})

describe('animeMediaRepository', () => {
  it('returns media for the three query methods', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    expect(await animeMediaRepository.getMediaByAnimeId(1)).toEqual([{ id: 1 }])
    expect(await animeMediaRepository.getMediaByAnimeIds([1])).toEqual([
      { id: 1 },
    ])
    expect(
      await animeMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        animeId: 1,
      })
    ).toEqual([{ id: 1 }])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeMediaRepository.getMediaByAnimeId(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeMediaRepository.getMediaByAnimeIds([1])
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        animeId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('characterMediaRepository', () => {
  it('returns media and short-circuits for empty ids', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    expect(await characterMediaRepository.getMediaByCharacterIds([1])).toEqual([
      { id: 1 },
    ])
    expect(await characterMediaRepository.getMediaByCharacterIds([])).toEqual(
      []
    )
    expect(
      await characterMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        characterId: 1,
      })
    ).toEqual([{ id: 1 }])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      characterMediaRepository.getMediaByCharacterIds([1])
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      characterMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        characterId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('episodeMediaRepository', () => {
  it('maps episode sources into media assets', async () => {
    select.mockReturnValue(chainResolving([{ id: 3, src: 'ep.mp4' }]))
    expect(
      await episodeMediaRepository.getMediaByEntityAndType({
        mediaType: 'video',
        episodeId: 1,
      })
    ).toEqual([{ id: 3, mediaType: 'video', src: 'ep.mp4', size: null }])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      episodeMediaRepository.getMediaByEntityAndType({
        mediaType: 'video',
        episodeId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('musicMediaRepository', () => {
  it('filters by version and resolution and drops null src', async () => {
    select.mockReturnValue(
      chainResolving([
        {
          id: 1,
          resolution: '1080p',
          audioUrl: 'a.mp3',
          videoUrl: 'v.mp4',
          dbVersion: 1,
        },
        {
          id: 2,
          resolution: '720p',
          audioUrl: null,
          videoUrl: null,
          dbVersion: 2,
        },
      ])
    )

    const audio = await musicMediaRepository.getMediaByEntityAndType({
      mediaType: 'audio',
      musicId: 1,
    })
    expect(audio).toEqual([
      { id: 1, mediaType: 'audio', src: 'a.mp3', size: '1080p' },
    ])

    const video = await musicMediaRepository.getMediaByEntityAndType({
      mediaType: 'video',
      musicId: 1,
      version: '1',
      resolution: '1080',
    })
    expect(video).toEqual([
      { id: 1, mediaType: 'video', src: 'v.mp4', size: '1080p' },
    ])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      musicMediaRepository.getMediaByEntityAndType({
        mediaType: 'audio',
        musicId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('staffMediaRepository', () => {
  it('maps staff media rows', async () => {
    select.mockReturnValue(
      chainResolving([
        { id: 5, mediaType: 'poster', src: 's.jpg', size: 'large' },
      ])
    )
    expect(
      await staffMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        staffId: 1,
      })
    ).toEqual([{ id: 5, mediaType: 'poster', src: 's.jpg', size: 'large' }])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      staffMediaRepository.getMediaByEntityAndType({
        mediaType: 'poster',
        staffId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})
