/**
 * Round-trip tests for the `/full` media proxy URLs.
 *
 * @module domains/anime/__tests__/mappers/anime-full-media-index
 * @remarks
 * Every `media[].src` built by {@link mapAnimeToFullDetails} must resolve back
 * to the very asset it was built from through the `/media` resolver
 * ({@link mapFilteredMediaAssets} + {@link mapIndexedMediaAsset}). Uses the
 * real URL builder and source detection — no media mocks.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

import { mapAnimeToFullDetails } from '@anime/mappers/anime-full'
import type { AnimeDB } from '@anime/types'
import {
  mapFilteredMediaAssets,
  mapIndexedMediaAsset,
} from '@media/mappers/media-assets'
import type { MediaSource } from '@media/mappers/media-assets/types'
import type { MediaAsset, MediaSize } from '@media/types/media-types'

const asset = (
  id: number,
  src: string,
  size: string | null = 'default'
): MediaAsset => ({ id, mediaType: 'banner', size, src }) as MediaAsset

const mapFull = (media: MediaAsset[]) =>
  mapAnimeToFullDetails({
    anime: { malId: 1, title: 'Test' } as AnimeDB,
    genres: [],
    themes: [],
    demographics: [],
    media,
    titleSynonyms: [],
    relations: [],
    relationData: [],
    externalIds: {
      animeId: 1,
      animeThemesSlug: null,
      kitsuId: null,
      tvdbId: null,
    } as never,
    animeMusic: [],
    producers: [],
  })

const resolve = (assets: MediaAsset[], url: string | undefined) => {
  const parsed = new URL(url ?? '', 'https://anidev.test')
  const [, , , , , size, index] = parsed.pathname.split('/')
  const filtered = mapFilteredMediaAssets({
    assets,
    mediaSize: size as MediaSize,
    source: (parsed.searchParams.get('source') ?? undefined) as
      | MediaSource
      | undefined,
  })
  return mapIndexedMediaAsset(filtered, Number(index))
}

describe('mapAnimeToFullDetails media URLs', () => {
  it('round-trips each URL to its own asset across mixed sources', () => {
    const media = [
      asset(3, 'https://artworks.thetvdb.com/c.jpg'),
      asset(1, 'https://s4.anilist.co/a.jpg'),
      asset(2, 'https://s4.anilist.co/b.jpg'),
    ]

    const urls = mapFull(media).media.map((item) => item.src)

    expect(urls).toEqual([
      '/media/anime/1/banner/default/1?source=thetvdb',
      '/media/anime/1/banner/default/1?source=anilist',
      '/media/anime/1/banner/default/2?source=anilist',
    ])
    expect(urls.map((url) => resolve(media, url)?.id)).toEqual([3, 1, 2])
  })

  it('groups non-normalized size labels with the default size', () => {
    const media = [
      asset(1, 'https://s4.anilist.co/a.jpg', null),
      asset(2, 'https://s4.anilist.co/b.jpg', 'original'),
    ]

    const result = mapFull(media).media

    expect(result.map((item) => item.src)).toEqual([
      '/media/anime/1/banner/default/1?source=anilist',
      '/media/anime/1/banner/default/2?source=anilist',
    ])
    expect(result.map((item) => resolve(media, item.src)?.id)).toEqual([1, 2])
  })
})
