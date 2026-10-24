/**
 * Tests for {@link mapMusicListToAnimeMusic}.
 *
 * @module domains/anime/__tests__/mappers/anime-music
 * @remarks
 * Covers OP/ED type mapping, theme order, title fallback, and site URL construction. `@/config`
 * is mocked so the env-validated config is not loaded. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

import { mapMusicListToAnimeMusic } from '@anime/mappers/anime-music'
import type { AnimeThemeDB } from '@music/types/music-db-types'

const music = (over: Partial<AnimeThemeDB>): AnimeThemeDB =>
  ({
    id: 1,
    title: 'Blue Bird',
    type: 'OP',
    sequence: 1,
    episodes: '1-12',
    ...over,
  }) as AnimeThemeDB

describe('mapMusicListToAnimeMusic', () => {
  it('maps OP to opening and ED to ending', () => {
    const result = mapMusicListToAnimeMusic([
      music({ type: 'OP' }),
      music({ id: 2, type: 'ED' }),
    ])
    expect(result[0].type).toBe('opening')
    expect(result[1].type).toBe('ending')
  })

  it('treats unknown types as opening', () => {
    expect(
      mapMusicListToAnimeMusic([music({ type: 'UNK' as never })])[0].type
    ).toBe('opening')
  })

  it('uses the real theme number published by MAL (OP1 before OP2)', () => {
    const result = mapMusicListToAnimeMusic([
      music({ id: 1, sequence: 2 }),
      music({ id: 2, sequence: 1 }),
    ])
    expect(result.map((r) => r.order)).toEqual([2, 1])
  })

  it('falls back to the array position when the source has no theme number', () => {
    const result = mapMusicListToAnimeMusic([
      music({ sequence: null }),
      music({ id: 2, sequence: null }),
    ])
    expect(result.map((r) => r.order)).toEqual([1, 2])
  })

  it('exposes the episode range the theme covers', () => {
    expect(
      mapMusicListToAnimeMusic([music({ episodes: '1-30' })])[0].episodes
    ).toBe('1-30')
  })

  it('builds the site url with a normalized slug (case preserved)', () => {
    const result = mapMusicListToAnimeMusic([
      music({ id: 7, title: 'Blue Bird' }),
    ])
    expect(result[0].url).toBe('https://anidev.test/music/7/Blue-Bird')
  })

  it('falls back to Unknown Title when title is missing', () => {
    const result = mapMusicListToAnimeMusic([music({ title: null })])
    expect(result[0].title).toBe('Unknown Title')
  })

  it('returns an empty array for an empty list', () => {
    expect(mapMusicListToAnimeMusic([])).toEqual([])
  })
})
