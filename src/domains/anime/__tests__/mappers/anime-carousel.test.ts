/**
 * Tests for the anime-carousel mapper.
 *
 * @module domains/anime/__tests__/mappers/anime-carousel
 * @remarks
 * Covers source priority in {@link pickBestAsset}, the empty-string fallback
 * for missing artwork, genre link building, and the numeric/`season` defaults.
 * {@link buildMediaUrl} and {@link detectMediaSource} are mocked so the mapper
 * is exercised without the media config.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({
    type,
    size,
    source,
  }: {
    type: string
    size: string
    source: string
  }) => `url:${type}:${size}:${source}`,
}))

vi.mock('@media/mappers/media-assets', () => ({
  detectMediaSource: (src: string) => src.split(':')[0],
}))

import { mapCarouselItem, pickBestAsset } from '@anime/mappers/anime-carousel'
import type { AnimeDB, GenreDB } from '@anime/types'
import type { MediaAsset } from '@media/types'

const asset = (over: Partial<MediaAsset>): MediaAsset => ({
  id: 1,
  mediaType: 'banner',
  src: 'kitsu:/banner.jpg',
  size: 'large',
  ...over,
})

const anime = (over: Partial<AnimeDB> = {}): AnimeDB =>
  ({
    malId: 1,
    title: 'Cowboy Bebop',
    synopsis: 'Bounty hunters in space.',
    score: 8.75,
    year: 1998,
    season: 'spring',
    ...over,
  }) as AnimeDB

const genres: GenreDB[] = [
  { malId: 1, name: 'Action' },
  { malId: 24, name: 'Sci-Fi' },
]

describe('pickBestAsset', () => {
  it('prefers the highest-priority source over document order', () => {
    const assets = [
      asset({ id: 1, src: 'thetvdb:/a.jpg' }),
      asset({ id: 2, src: 'anilist:/b.jpg' }),
      asset({ id: 3, src: 'kitsu:/c.jpg' }),
    ]
    expect(pickBestAsset(assets, 'banner')?.id).toBe(2)
  })

  it('falls back to the first match when no source is prioritised', () => {
    const assets = [asset({ id: 7, src: 'custom:/a.jpg' })]
    expect(pickBestAsset(assets, 'banner')?.id).toBe(7)
  })

  it('returns undefined when the media type is absent', () => {
    expect(pickBestAsset([asset({})], 'clearlogo')).toBeUndefined()
  })
})

describe('mapCarouselItem', () => {
  it('builds proxied media URLs for banner and clear logo', () => {
    const slide = mapCarouselItem({
      anime: anime(),
      media: [
        asset({ mediaType: 'banner', src: 'anilist:/b.jpg', size: 'large' }),
        asset({ mediaType: 'clearlogo', src: 'kitsu:/l.png', size: null }),
      ],
      genres,
    })

    expect(slide.bannerImage).toBe('url:banner:large:anilist')
    expect(slide.clearLogo).toBe('url:clearlogo:default:kitsu')
  })

  it('leaves missing artwork as an empty string', () => {
    const slide = mapCarouselItem({ anime: anime(), media: [], genres: [] })
    expect(slide.bannerImage).toBe('')
    expect(slide.clearLogo).toBe('')
  })

  it('links each genre to its discover filter', () => {
    const slide = mapCarouselItem({ anime: anime(), media: [], genres })
    expect(slide.genres).toEqual([
      { malId: 1, name: 'Action', url: '/discover?genre=Action' },
      { malId: 24, name: 'Sci-Fi', url: '/discover?genre=Sci-Fi' },
    ])
  })

  it('defaults nullable numerics and season', () => {
    const slide = mapCarouselItem({
      anime: anime({ synopsis: null, score: null, year: null, season: null }),
      media: [],
      genres: [],
    })

    expect(slide).toMatchObject({
      description: '',
      score: 0,
      year: 0,
      season: 'Unknown',
    })
  })
})
