/**
 * Tests for {@link resolveMedia}.
 *
 * @module domains/media/__tests__/services/resolve-media
 * @remarks
 * Covers the happy path (returns the indexed asset) and the placeholder fallback when no asset
 * matches. Repository access and the asset mappers are mocked. Follows the repo TDD/unit-test
 * layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaEntity, MediaSize, MediaType } from '@media/types'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))

const { resolveAssets, mapFiltered, mapIndexed } = vi.hoisted(() => ({
  resolveAssets: vi.fn(),
  mapFiltered: vi.fn(),
  mapIndexed: vi.fn(),
}))

vi.mock('@utils/image/normalize-media-util', () => ({
  resolveMediaAssets: resolveAssets,
}))
vi.mock('@media/mappers/media-assets', () => ({
  mapFilteredMediaAssets: mapFiltered,
  mapIndexedMediaAsset: mapIndexed,
}))

import { resolveMedia } from '@media/services/resolve-media'

const path = {
  entityType: MediaEntity.ANIME,
  entityId: 1,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.LARGE,
  mediaId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveMedia', () => {
  it('returns the indexed asset when one matches', async () => {
    resolveAssets.mockResolvedValue([{ id: 1 }])
    mapFiltered.mockReturnValue([{ id: 1 }])
    mapIndexed.mockReturnValue({ id: 1, src: 'real.jpg' })

    const result = await resolveMedia(path, 'myanimelist')

    expect(mapFiltered).toHaveBeenCalledWith({
      assets: [{ id: 1 }],
      mediaSize: MediaSize.LARGE,
      source: 'myanimelist',
    })
    expect(result).toEqual({ id: 1, src: 'real.jpg' })
  })

  it('returns a placeholder asset when nothing matches', async () => {
    resolveAssets.mockResolvedValue([])
    mapFiltered.mockReturnValue([])
    mapIndexed.mockReturnValue(undefined)

    const result = await resolveMedia(path)

    expect(result).toEqual({
      id: 0,
      mediaType: 'poster',
      src: 'http://localhost/placeholder.webp',
      size: MediaSize.LARGE,
    })
  })
})
