/**
 * Tests for {@link resolveMediaAssets} repository dispatch.
 *
 * @module domains/media/__tests__/services/resolve-media-assets
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError } from '@shared/errors/app-error'
import { MediaEntity, MediaSize, MediaType } from '@media/types/media-types'
import { resolveMediaAssets } from '@media/services/resolve-media-assets'

const animeGet = vi.fn()
const characterGet = vi.fn()
const staffGet = vi.fn()
const episodeGet = vi.fn()
const musicGet = vi.fn()

vi.mock('@media/repositories/anime-media', () => ({
  animeMediaRepository: {
    getMediaByEntityAndType: (args: unknown) => animeGet(args),
  },
}))
vi.mock('@media/repositories/character-media', () => ({
  characterMediaRepository: {
    getMediaByEntityAndType: (args: unknown) => characterGet(args),
  },
}))
vi.mock('@media/repositories/staff-media', () => ({
  staffMediaRepository: {
    getMediaByEntityAndType: (args: unknown) => staffGet(args),
  },
}))
vi.mock('@media/repositories/episode-media', () => ({
  episodeMediaRepository: {
    getMediaByEntityAndType: (args: unknown) => episodeGet(args),
  },
}))
vi.mock('@media/repositories/music-media', () => ({
  musicMediaRepository: {
    getMediaByEntityAndType: (args: unknown) => musicGet(args),
  },
}))

describe('resolveMediaAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches anime paths to the anime repository', async () => {
    animeGet.mockResolvedValue(['asset'])
    const result = await resolveMediaAssets({
      entityType: MediaEntity.ANIME,
      entityId: 7,
      mediaType: MediaType.POSTER,
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
    })
    expect(result).toEqual(['asset'])
    expect(animeGet).toHaveBeenCalledWith({
      mediaType: MediaType.POSTER,
      animeId: 7,
    })
  })

  it('dispatches character paths to the character repository', async () => {
    characterGet.mockResolvedValue([])
    await resolveMediaAssets({
      entityType: MediaEntity.CHARACTER,
      entityId: 9,
      mediaType: MediaType.POSTER,
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
    })
    expect(characterGet).toHaveBeenCalledWith({
      mediaType: MediaType.POSTER,
      characterId: 9,
    })
  })

  it('dispatches staff paths to the staff repository', async () => {
    staffGet.mockResolvedValue([])
    await resolveMediaAssets({
      entityType: MediaEntity.STAFF,
      entityId: 3,
      mediaType: MediaType.POSTER,
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
    })
    expect(staffGet).toHaveBeenCalledWith({
      mediaType: MediaType.POSTER,
      staffId: 3,
    })
  })

  it('dispatches episode paths to the episode repository', async () => {
    episodeGet.mockResolvedValue([])
    await resolveMediaAssets({
      entityType: MediaEntity.EPISODE,
      entityId: 8,
      mediaType: 'video' as unknown as MediaType,
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
    })
    expect(episodeGet).toHaveBeenCalledWith({
      mediaType: 'video',
      episodeId: 8,
    })
  })

  it('forwards version and resolution for music paths', async () => {
    musicGet.mockResolvedValue([])
    await resolveMediaAssets({
      entityType: MediaEntity.MUSIC,
      entityId: 4,
      mediaType: MediaType.BANNER,
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
      version: 'v2',
      resolution: '1080p',
    })
    expect(musicGet).toHaveBeenCalledWith({
      mediaType: MediaType.BANNER,
      musicId: 4,
      version: 'v2',
      resolution: '1080p',
    })
  })

  it('throws a DomainError for an unsupported entity type', async () => {
    await expect(
      resolveMediaAssets({
        // @ts-expect-error deliberately unsupported entity for the error path
        entityType: 'studio',
        entityId: 1,
        mediaType: MediaType.POSTER,
        mediaSize: MediaSize.DEFAULT,
        mediaId: 1,
      })
    ).rejects.toBeInstanceOf(DomainError)
  })
})
