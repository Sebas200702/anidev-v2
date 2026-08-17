/**
 * Tests for {@link mapAnimeToFullDetails}.
 *
 * @module domains/anime/__tests__/mappers/anime-full
 * @remarks
 * Covers OP/ED music splitting, scalar defaults, taxonomy `{name,malId}` shaping, per-group asset
 * indexing, and external-id passthrough. `@/config`, {@link buildMediaUrl}, and
 * {@link detectMediaSource} are mocked so the mapper runs without loading config or media repos.
 * Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({ type, index }: { type: string; index?: number }) =>
    `url:${type}:${index ?? 1}`,
}))
vi.mock('@media/mappers/media-assets', () => ({
  detectMediaSource: () => 'myanimelist',
}))

import { mapAnimeToFullDetails } from '@anime/mappers/anime-full'
import type { AnimeDB } from '@anime/types'
import type { MediaAsset } from '@media/types/media-types'
import type { MusicDB } from '@music/types'

const anime = (over: Partial<AnimeDB>): AnimeDB =>
  ({
    malId: 20,
    title: 'Naruto',
    ...over,
  }) as AnimeDB

const taxonomy = (name: string, malId: number) => ({ name, malId }) as never

const baseInput = (
  over: Partial<Parameters<typeof mapAnimeToFullDetails>[0]> = {}
) => ({
  anime: anime({}),
  genres: [taxonomy('Action', 1)],
  themes: [taxonomy('School', 2)],
  demographics: [taxonomy('Shounen', 3)],
  media: [] as MediaAsset[],
  titleSynonyms: [],
  relations: [],
  relationData: [],
  externalIds: {
    animeId: 20,
    animeThemesSlug: null,
    kitsuId: null,
    tvdbId: null,
  } as never,
  animeMusic: [] as MusicDB[],
  ...over,
})

describe('mapAnimeToFullDetails', () => {
  it('splits OP and ED music', () => {
    const result = mapAnimeToFullDetails(
      baseInput({
        animeMusic: [
          { id: 1, title: 'OP1', type: 'OP' } as MusicDB,
          { id: 2, title: 'ED1', type: 'ED' } as MusicDB,
        ],
      })
    )
    expect(result.music.openings).toHaveLength(1)
    expect(result.music.endings).toHaveLength(1)
    expect(result.music.openings[0].type).toBe('opening')
  })

  it('applies scalar defaults for missing fields', () => {
    const result = mapAnimeToFullDetails(baseInput())
    expect(result).toMatchObject({
      year: 0,
      score: 0,
      scoredBy: 0,
      popularityRank: 0,
      rating: 'Unknown',
      season: 'Unknown',
      background: '',
      status: 'Unknown',
      type: 'Unknown',
      episodes: 0,
      synopsis: 'No synopsis available.',
    })
  })

  it('shapes taxonomy into name/malId objects', () => {
    const result = mapAnimeToFullDetails(baseInput())
    expect(result.genres).toEqual([{ name: 'Action', malId: 1 }])
    expect(result.themes).toEqual([{ name: 'School', malId: 2 }])
    expect(result.demographics).toEqual([{ name: 'Shounen', malId: 3 }])
  })

  it('indexes assets 1-based within each type/size group', () => {
    const result = mapAnimeToFullDetails(
      baseInput({
        media: [
          {
            id: 11,
            mediaType: 'poster',
            size: 'large',
            src: 'a',
          } as MediaAsset,
          {
            id: 12,
            mediaType: 'poster',
            size: 'large',
            src: 'b',
          } as MediaAsset,
        ],
      })
    )
    expect(result.media.map((m) => m.src)).toEqual([
      'url:poster:1',
      'url:poster:2',
    ])
  })

  it('passes external ids through the external mapper', () => {
    const result = mapAnimeToFullDetails(
      baseInput({
        externalIds: {
          animeId: 20,
          animeThemesSlug: 'naruto',
          kitsuId: null,
          tvdbId: null,
        } as never,
      })
    )
    expect(result.externalIds).toEqual([
      { id: 'naruto', source: 'animeThemes' },
    ])
  })
})
