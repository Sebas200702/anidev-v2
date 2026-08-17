/**
 * Tests for the music-card mapper.
 *
 * @module domains/music/__tests__/mappers/music-card
 * @remarks
 * Covers type-code normalization (OP/ED/UNK), label derivation, title/artist fallbacks, and list
 * mapping with artists grouped by music id. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { mapMusicCard, mapMusicListToCards } from '@music/mappers/music-card'
import type { MusicArtistDB, MusicDB } from '@music/types/music-db-types'

const music = (over: Partial<MusicDB>): MusicDB =>
  ({ id: 1, title: 'Blue Bird', type: 'OP', ...over }) as MusicDB

const artist = (over: Partial<MusicArtistDB>): MusicArtistDB =>
  ({ malId: 10, name: 'Ikimono-gakari', ...over }) as MusicArtistDB

describe('mapMusicCard', () => {
  it('maps OP to opening', () => {
    const card = mapMusicCard({ music: music({ type: 'OP' }), artists: [] })
    expect(card.type).toBe('opening')
    expect(card.typeCode).toBe('OP')
  })

  it('maps ED to ending', () => {
    const card = mapMusicCard({ music: music({ type: 'ED' }), artists: [] })
    expect(card.type).toBe('ending')
    expect(card.typeCode).toBe('ED')
  })

  it('normalizes unrecognized type codes to UNK/unknown', () => {
    const card = mapMusicCard({
      music: music({ type: 'XX' as never }),
      artists: [],
    })
    expect(card.typeCode).toBe('UNK')
    expect(card.type).toBe('unknown')
  })

  it('applies title and artist fallbacks', () => {
    const card = mapMusicCard({
      music: music({ title: null as unknown as string }),
      artists: [
        artist({
          name: null as unknown as string,
          malId: null as unknown as number,
        }),
      ],
    })
    expect(card.title).toBe('Unknown Title')
    expect(card.artists).toEqual([{ name: 'Unknown Artist', malId: 0 }])
  })
})

describe('mapMusicListToCards', () => {
  it('maps each row with its grouped artists', () => {
    const cards = mapMusicListToCards({
      musicList: [music({ id: 1 }), music({ id: 2 })],
      artistsByMusicId: { 1: [artist({ name: 'A' })] },
    })
    expect(cards[0].artists).toEqual([{ name: 'A', malId: 10 }])
    expect(cards[1].artists).toEqual([])
  })

  it('returns an empty array for an empty list', () => {
    expect(
      mapMusicListToCards({ musicList: [], artistsByMusicId: {} })
    ).toEqual([])
  })
})
