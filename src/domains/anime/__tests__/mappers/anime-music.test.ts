/**
 * Tests for {@link mapMusicListToAnimeMusic}.
 *
 * @module domains/anime/__tests__/mappers/anime-music
 * @remarks
 * Covers OP/ED type mapping, 1-based order, title fallback, and site URL construction. `@/config`
 * is mocked so the env-validated config is not loaded. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

import { mapMusicListToAnimeMusic } from '@anime/mappers/anime-music'
import type { MusicDB } from '@music/types/music-db-types'

const music = (over: Partial<MusicDB>): MusicDB =>
  ({ id: 1, title: 'Blue Bird', type: 'OP', ...over }) as MusicDB

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

  it('assigns 1-based order by array position', () => {
    const result = mapMusicListToAnimeMusic([music({}), music({ id: 2 })])
    expect(result.map((r) => r.order)).toEqual([1, 2])
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
