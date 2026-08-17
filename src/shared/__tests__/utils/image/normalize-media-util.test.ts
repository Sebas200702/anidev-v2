/**
 * Tests for the media normalization helpers.
 *
 * @module shared/__tests__/utils/image/normalize-media-util
 * @remarks
 * Covers index clamping ({@link normalizeMediaId}), size normalization ({@link normalizeAssetSize}),
 * and repository dispatch/error behavior of {@link resolveMediaAssets} with mocked repositories.
 * Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import { MediaEntity, MediaSize, MediaType } from '@media/types/media-types'
import {
  normalizeAssetSize,
  normalizeMediaId,
  resolveMediaAssets,
} from '@utils/image/normalize-media-util'

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

describe('normalizeMediaId', () => {
  it('clamps values above the total', () => {
    expect(normalizeMediaId(99, 5)).toBe(5)
  })

  it('defaults missing or non-positive ids to 1', () => {
    expect(normalizeMediaId(undefined, 10)).toBe(1)
    expect(normalizeMediaId(0, 10)).toBe(1)
    expect(normalizeMediaId(-3, 10)).toBe(1)
  })

  it('returns the id when within range', () => {
    expect(normalizeMediaId(3, 10)).toBe(3)
  })
})

describe('normalizeAssetSize', () => {
  it('passes through small and large', () => {
    expect(normalizeAssetSize('small')).toBe(MediaSize.SMALL)
    expect(normalizeAssetSize('large')).toBe(MediaSize.LARGE)
  })

  it('maps unknown or null to default', () => {
    expect(normalizeAssetSize('medium')).toBe(MediaSize.DEFAULT)
    expect(normalizeAssetSize(null)).toBe(MediaSize.DEFAULT)
  })
})

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

  it('throws an InfraError for an unsupported entity type', async () => {
    await expect(
      resolveMediaAssets({
        // @ts-expect-error deliberately unsupported entity for the error path
        entityType: 'studio',
        entityId: 1,
        mediaType: MediaType.POSTER,
        mediaSize: MediaSize.DEFAULT,
        mediaId: 1,
      })
    ).rejects.toBeInstanceOf(InfraError)
  })
})
