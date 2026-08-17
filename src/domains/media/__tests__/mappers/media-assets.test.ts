/**
 * Tests for the media-assets mapper.
 *
 * @module domains/media/__tests__/mappers/media-assets
 * @remarks
 * Covers source detection by hostname, size/source filtering, and 1-based index selection with
 * clamping. `@utils/image/normalize-media-util` is mocked with pure equivalents so the media
 * repositories (and their DB/config wiring) are not loaded. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'
import { MediaSize } from '@media/types/media-types'

vi.mock('@utils/image/normalize-media-util', () => ({
  normalizeAssetSize: (size: string | null) =>
    size === 'small' || size === 'large' ? size : 'default',
  normalizeMediaId: (mediaId: number | undefined, total: number) => {
    const candidate = mediaId && mediaId > 0 ? mediaId : 1
    return Math.min(Math.max(candidate, 1), total)
  },
}))

import {
  detectMediaSource,
  mapFilteredMediaAssets,
  mapIndexedMediaAsset,
} from '@media/mappers/media-assets'
import type { MediaAsset } from '@media/types/media-types'

const asset = (over: Partial<MediaAsset>): MediaAsset =>
  ({
    id: 1,
    src: 'https://cdn.myanimelist.net/x.jpg',
    size: 'default',
    mediaType: 'poster',
    ...over,
  }) as MediaAsset

describe('detectMediaSource', () => {
  it.each([
    ['https://cdn.myanimelist.net/x.jpg', 'myanimelist'],
    ['https://anilist.co/x.jpg', 'anilist'],
    ['https://media.kitsu.io/x.jpg', 'kitsu'],
    ['https://thetvdb.com/x.jpg', 'thetvdb'],
    ['https://image.tmdb.org/x.jpg', 'tmdb'],
    ['https://i.youtube.com/x.jpg', 'youtube'],
    ['https://example.com/x.jpg', 'custom'],
  ])('maps %s to %s', (src, expected) => {
    expect(detectMediaSource(src)).toBe(expected)
  })

  it('returns custom for an invalid URL', () => {
    expect(detectMediaSource('not a url')).toBe('custom')
  })
})

describe('mapFilteredMediaAssets', () => {
  it('filters by normalized size', () => {
    const result = mapFilteredMediaAssets({
      assets: [
        asset({ id: 1, size: 'large' }),
        asset({ id: 2, size: 'small' }),
      ],
      mediaSize: MediaSize.LARGE,
    })
    expect(result.map((a) => a.id)).toEqual([1])
  })

  it('returns all size matches when no source is given', () => {
    const result = mapFilteredMediaAssets({
      assets: [asset({ id: 1 }), asset({ id: 2 })],
      mediaSize: MediaSize.DEFAULT,
    })
    expect(result).toHaveLength(2)
  })

  it('additionally filters by detected source', () => {
    const result = mapFilteredMediaAssets({
      assets: [
        asset({ id: 1, src: 'https://cdn.myanimelist.net/a.jpg' }),
        asset({ id: 2, src: 'https://anilist.co/b.jpg' }),
      ],
      mediaSize: MediaSize.DEFAULT,
      source: 'myanimelist',
    })
    expect(result.map((a) => a.id)).toEqual([1])
  })
})

describe('mapIndexedMediaAsset', () => {
  it('returns undefined for an empty list', () => {
    expect(mapIndexedMediaAsset([], 1)).toBeUndefined()
  })

  it('selects the 1-based index', () => {
    const assets = [asset({ id: 10 }), asset({ id: 20 })]
    expect(mapIndexedMediaAsset(assets, 2)?.id).toBe(20)
  })

  it('clamps out-of-range indices to the last asset', () => {
    const assets = [asset({ id: 10 }), asset({ id: 20 })]
    expect(mapIndexedMediaAsset(assets, 99)?.id).toBe(20)
  })

  it('defaults a missing index to the first asset', () => {
    const assets = [asset({ id: 10 }), asset({ id: 20 })]
    expect(mapIndexedMediaAsset(assets, undefined)?.id).toBe(10)
  })
})
