/**
 * Branch coverage for {@link buildAnimeListFilters}.
 *
 * @module domains/anime/__tests__/repositories/anime-list-filters-all
 * @remarks
 * Pure function returning a `SQL[]`. Exercises every optional filter branch, the `full` parental
 * bypass, and the safe (fail-closed) default. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { buildAnimeListFilters } from '@anime/repositories/anime-list/filters'

describe('buildAnimeListFilters', () => {
  it('adds the not-adult floor for the safe (default) variant', () => {
    expect(buildAnimeListFilters({}).length).toBe(1)
  })

  it('omits the not-adult floor for the full variant', () => {
    expect(buildAnimeListFilters({ parentalVariant: 'full' }).length).toBe(0)
  })

  it('adds a condition per provided filter', () => {
    const filters = buildAnimeListFilters({
      parentalVariant: 'full',
      year: 2020,
      season: 'spring',
      scoreMin: 5,
      scoreMax: 9,
      status: ['Finished'],
      rating: ['PG-13'],
      type: ['TV'],
      genre: ['Action'],
      query: '  naruto  ',
    })
    // year, season, scoreMin, scoreMax, status, rating, type, genre, query = 9
    expect(filters.length).toBe(9)
  })

  it('ignores blank query and empty arrays', () => {
    const filters = buildAnimeListFilters({
      parentalVariant: 'full',
      query: '   ',
      status: [],
      genre: [],
    })
    expect(filters.length).toBe(0)
  })
})
