/**
 * Unit tests for the anime-filters mapper (advanced-search additions).
 *
 * @module domains/anime/__tests__/mappers/anime-filters
 */
import { describe, expect, it } from 'vitest'
import { mapAnimeFilters } from '@anime/mappers/anime-filters'
import { animeFiltersParamsSchema } from '@anime/schemas/anime-list-schema'

const params = (raw: Record<string, unknown>) =>
  animeFiltersParamsSchema.parse(raw)

describe('mapAnimeFilters — advanced filters', () => {
  it('passes through season and score range', () => {
    const filters = mapAnimeFilters(
      params({ season: 'spring', scoreMin: '7', scoreMax: '9' })
    )
    expect(filters.season).toBe('spring')
    expect(filters.scoreMin).toBe(7)
    expect(filters.scoreMax).toBe(9)
  })

  it('passes through an explicit sort and order', () => {
    const filters = mapAnimeFilters(params({ sort: 'year', order: 'asc' }))
    expect(filters.sort).toBe('year')
    expect(filters.order).toBe('asc')
  })

  it('defaults sort to score and order to desc when unset', () => {
    const filters = mapAnimeFilters(params({}))
    expect(filters.sort).toBe('score')
    expect(filters.order).toBe('desc')
  })

  it('preserves existing facet normalization and scalars', () => {
    const filters = mapAnimeFilters(
      params({ genre: 'Action', year: '2024', query: 'naruto' })
    )
    expect(filters.genre).toEqual(['Action'])
    expect(filters.year).toBe(2024)
    expect(filters.query).toBe('naruto')
    expect(filters.page).toBe(1)
    expect(filters.limit).toBe(10)
  })
})
