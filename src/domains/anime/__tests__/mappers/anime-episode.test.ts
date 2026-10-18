/**
 * Unit tests for the anime episode mappers.
 *
 * @module domains/anime/__tests__/mappers/anime-episode
 * @remarks
 * List items drop `animeId` and `synopsis`; the detail keeps the synopsis. Source text fields
 * (`duration`, `aired`) pass through unparsed.
 */
import { describe, expect, it } from 'vitest'
import {
  mapAnimeEpisodeDetail,
  mapAnimeEpisodeItems,
} from '@anime/mappers/anime-episode'
import type { EpisodeDB } from '@anime/types'

const row = (overrides: Partial<EpisodeDB> = {}): EpisodeDB => ({
  id: 10,
  animeId: 1,
  number: 1,
  title: 'Asteroid Blues',
  synopsis: 'Spike and Jet head to Tijuana.',
  duration: '25 min',
  aired: '1998-10-23',
  ...overrides,
})

describe('mapAnimeEpisodeItems', () => {
  it('maps rows to list items without synopsis or animeId', () => {
    expect(mapAnimeEpisodeItems([row()])).toEqual([
      {
        id: 10,
        number: 1,
        title: 'Asteroid Blues',
        duration: '25 min',
        aired: '1998-10-23',
      },
    ])
  })

  it('keeps row order and nullable fields', () => {
    const items = mapAnimeEpisodeItems([
      row({ id: 1, number: 1 }),
      row({ id: 2, number: 2, duration: null, aired: null }),
    ])
    expect(items.map((item) => item.number)).toEqual([1, 2])
    expect(items[1]).toMatchObject({ duration: null, aired: null })
  })
})

describe('mapAnimeEpisodeDetail', () => {
  it('keeps the synopsis and drops animeId', () => {
    const detail = mapAnimeEpisodeDetail(row())
    expect(detail.synopsis).toBe('Spike and Jet head to Tijuana.')
    expect(detail).not.toHaveProperty('animeId')
  })
})
