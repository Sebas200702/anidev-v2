/**
 * Tests for the anime-card mapper.
 *
 * @module domains/anime/__tests__/mappers/anime-card
 * @remarks
 * Covers field passthrough, the `'Unknown'` defaults for type/status, the `?? 0` year fallback, and
 * list mapping order. {@link buildMediaUrl} is mocked so the mapper is exercised in isolation
 * without loading the media config. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({ size }: { size: string }) => `url:${size}`,
}))

import { mapAnimeCard, mapAnimeListToCards } from '@anime/mappers/anime-card'
import type { AnimeDB } from '@anime/types'

const anime = (over: Partial<AnimeDB>): AnimeDB =>
  ({
    malId: 1,
    title: 'Naruto',
    score: 8.1,
    type: 'TV',
    status: 'Finished',
    year: 2002,
    ...over,
  }) as AnimeDB

describe('mapAnimeCard', () => {
  it('maps core fields and both poster sizes', () => {
    const card = mapAnimeCard({ anime: anime({}) })
    expect(card).toMatchObject({
      malId: 1,
      title: 'Naruto',
      score: 8.1,
      type: 'TV',
      status: 'Finished',
      year: 2002,
      imageUrl: 'url:large',
      smallImageUrl: 'url:small',
      altImageText: 'Image for Naruto',
    })
  })

  it("defaults missing type and status to 'Unknown'", () => {
    const card = mapAnimeCard({ anime: anime({ type: null, status: null }) })
    expect(card.type).toBe('Unknown')
    expect(card.status).toBe('Unknown')
  })

  it('falls back to year 0 when year is null', () => {
    expect(mapAnimeCard({ anime: anime({ year: null }) }).year).toBe(0)
  })

  it('passes through a null score', () => {
    expect(mapAnimeCard({ anime: anime({ score: null }) }).score).toBeNull()
  })
})

describe('mapAnimeListToCards', () => {
  it('maps rows preserving order', () => {
    const cards = mapAnimeListToCards({
      animeList: [anime({ malId: 1 }), anime({ malId: 2 })],
    })
    expect(cards.map((c) => c.malId)).toEqual([1, 2])
  })

  it('returns an empty array for an empty list', () => {
    expect(mapAnimeListToCards({ animeList: [] })).toEqual([])
  })
})
