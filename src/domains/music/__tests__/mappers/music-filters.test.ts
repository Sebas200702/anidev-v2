/**
 * Tests for {@link mapMusicListFilters}.
 *
 * @module domains/music/__tests__/mappers/music-filters
 * @remarks
 * Covers type-label to DB-code coercion (case-insensitive), query trimming, and undefined handling
 * for absent/blank filters. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { mapMusicListFilters } from '@music/mappers/music-filters'
import type { MusicListFiltersParams } from '@music/types'

const params = (
  over: Partial<MusicListFiltersParams>
): MusicListFiltersParams =>
  ({ page: 1, limit: 10, ...over }) as MusicListFiltersParams

describe('mapMusicListFilters', () => {
  it('passes through page and limit', () => {
    const f = mapMusicListFilters(params({}))
    expect(f.page).toBe(1)
    expect(f.limit).toBe(10)
  })

  it('maps human labels to DB type codes', () => {
    expect(mapMusicListFilters(params({ type: 'opening' })).type).toBe('OP')
    expect(mapMusicListFilters(params({ type: 'ending' })).type).toBe('ED')
    expect(mapMusicListFilters(params({ type: 'unknown' })).type).toBe('UNK')
  })

  it('accepts DB codes directly and is case-insensitive', () => {
    expect(mapMusicListFilters(params({ type: 'OP' })).type).toBe('OP')
    expect(mapMusicListFilters(params({ type: 'Ed' })).type).toBe('ED')
  })

  it('returns undefined type for blank or unknown values', () => {
    expect(mapMusicListFilters(params({ type: '  ' })).type).toBeUndefined()
    expect(mapMusicListFilters(params({ type: 'remix' })).type).toBeUndefined()
    expect(mapMusicListFilters(params({})).type).toBeUndefined()
  })

  it('trims the query and maps blank to undefined', () => {
    expect(mapMusicListFilters(params({ query: '  naruto  ' })).query).toBe(
      'naruto'
    )
    expect(mapMusicListFilters(params({ query: '   ' })).query).toBeUndefined()
  })
})
