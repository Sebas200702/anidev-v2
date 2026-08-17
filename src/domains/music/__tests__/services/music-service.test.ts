/**
 * Tests for {@link musicService}.
 *
 * @module domains/music/__tests__/services/music-service
 * @remarks
 * Exercises the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`).
 * Covers the not-found path, resolution batching keyed by version id, and the no-versions branch.
 * Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicNotFoundError } from '@music/errors/music-not-found-error'

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
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Stale: 1, Medium: 2 } }))
vi.mock('@music/cache/music', () => ({
  musicCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const {
  getMusicById,
  findVersionsByMusicId,
  findResolutionsByVersionId,
  findArtistsByMusicId,
  mapDetail,
} = vi.hoisted(() => ({
  getMusicById: vi.fn(),
  findVersionsByMusicId: vi.fn(),
  findResolutionsByVersionId: vi.fn(),
  findArtistsByMusicId: vi.fn(),
  mapDetail: vi.fn(),
}))

vi.mock('@music/repositories/music', () => ({
  musicRepository: { getMusicById },
}))
vi.mock('@music/repositories/music-version', () => ({
  musicVersionRepository: {
    findVersionsByMusicId,
    findResolutionsByVersionId,
  },
}))
vi.mock('@music/repositories/music-relation', () => ({
  musicRelationRepository: { findArtistsByMusicId },
}))
vi.mock('@music/mappers/music-detail', () => ({ mapMusicDetail: mapDetail }))

import { musicService } from '@music/services/music'

describe('musicService.getMusicDetailsById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws MusicNotFoundError when the music row is missing', async () => {
    getMusicById.mockResolvedValue(null)
    findVersionsByMusicId.mockResolvedValue([])
    findArtistsByMusicId.mockResolvedValue([])

    await expect(musicService.getMusicDetailsById(42)).rejects.toBeInstanceOf(
      MusicNotFoundError
    )
  })

  it('maps details with an empty resolution map when there are no versions', async () => {
    getMusicById.mockResolvedValue({ id: 42 })
    findVersionsByMusicId.mockResolvedValue([])
    findArtistsByMusicId.mockResolvedValue([{ malId: 1 }])
    mapDetail.mockReturnValue({ title: 'X' })

    const { value } = await musicService.getMusicDetailsById(42)

    expect(findResolutionsByVersionId).not.toHaveBeenCalled()
    expect(mapDetail).toHaveBeenCalledWith({
      music: { id: 42 },
      artists: [{ malId: 1 }],
      versions: [],
      resolutionsByVersionId: {},
    })
    expect(value).toEqual({ title: 'X' })
  })

  it('batches resolutions keyed by version id', async () => {
    getMusicById.mockResolvedValue({ id: 42 })
    findVersionsByMusicId.mockResolvedValue([
      { versionId: 100 },
      { versionId: 200 },
    ])
    findArtistsByMusicId.mockResolvedValue([])
    findResolutionsByVersionId
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }])
    mapDetail.mockReturnValue({ title: 'X' })

    await musicService.getMusicDetailsById(42)

    expect(findResolutionsByVersionId).toHaveBeenCalledTimes(2)
    expect(mapDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutionsByVersionId: { 100: [{ id: 1 }], 200: [{ id: 2 }] },
      })
    )
  })
})
