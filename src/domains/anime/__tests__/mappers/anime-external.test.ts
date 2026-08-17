/**
 * Tests for {@link mapExternalIds}.
 *
 * @module domains/anime/__tests__/mappers/anime-external
 * @remarks
 * Covers which external platform identifiers are emitted based on populated columns, including the
 * `null` vs empty-string distinctions. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { mapExternalIds } from '@anime/mappers/anime-external'
import type { AnimeExternalDB } from '@anime/types'

const row = (over: Partial<AnimeExternalDB>): AnimeExternalDB =>
  ({
    animeId: 1,
    animeThemesSlug: null,
    kitsuId: null,
    tvdbId: null,
    ...over,
  }) as AnimeExternalDB

describe('mapExternalIds', () => {
  it('returns an empty array when no platforms are populated', () => {
    expect(mapExternalIds(row({}))).toEqual([])
  })

  it('returns an empty array when the row is missing (no external-ids row)', () => {
    expect(mapExternalIds(undefined as never)).toEqual([])
  })

  it('emits animeThemes for a non-empty slug', () => {
    expect(mapExternalIds(row({ animeThemesSlug: 'naruto' }))).toEqual([
      { id: 'naruto', source: 'animeThemes' },
    ])
  })

  it('does not emit animeThemes for an empty slug', () => {
    expect(mapExternalIds(row({ animeThemesSlug: '' }))).toEqual([])
  })

  it('emits kitsu and tvdb when their ids are present, including zero', () => {
    expect(mapExternalIds(row({ kitsuId: 0, tvdbId: 42 }))).toEqual([
      { id: 0, source: 'kitsu' },
      { id: 42, source: 'tvdb' },
    ])
  })

  it('emits all populated platforms in order', () => {
    expect(
      mapExternalIds(row({ animeThemesSlug: 'x', kitsuId: 1, tvdbId: 2 }))
    ).toEqual([
      { id: 'x', source: 'animeThemes' },
      { id: 1, source: 'kitsu' },
      { id: 2, source: 'tvdb' },
    ])
  })
})
