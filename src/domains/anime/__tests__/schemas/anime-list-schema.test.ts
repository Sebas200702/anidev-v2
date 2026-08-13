/**
 * Unit tests for the extended anime list/search request schema.
 *
 * @module domains/anime/__tests__/schemas/anime-list-schema
 * @remarks
 * Covers the advanced-search additions (season, score range, sort/order) and the
 * boundary refinements (score range order, relevance-requires-query), while
 * asserting backward compatibility of the pre-existing params.
 */
import { describe, expect, it } from 'vitest'
import {
  animeFiltersParamsSchema,
  animeListRequestSchema,
} from '@anime/schemas/anime-list-schema'

const query = (q: Record<string, unknown>) =>
  animeListRequestSchema.safeParse({ query: q })

describe('animeFiltersParamsSchema — new fields', () => {
  it('accepts season, score range and sort/order, coercing numeric strings', () => {
    const parsed = animeFiltersParamsSchema.parse({
      season: 'spring',
      scoreMin: '7',
      scoreMax: '9',
      sort: 'score',
      order: 'desc',
    })
    expect(parsed.season).toBe('spring')
    expect(parsed.scoreMin).toBe(7)
    expect(parsed.scoreMax).toBe(9)
    expect(parsed.sort).toBe('score')
    expect(parsed.order).toBe('desc')
  })

  it('keeps existing defaults (page/limit) and leaves new fields optional', () => {
    const parsed = animeFiltersParamsSchema.parse({})
    expect(parsed.page).toBe(1)
    expect(parsed.limit).toBe(10)
    expect(parsed.season).toBeUndefined()
    expect(parsed.sort).toBeUndefined()
  })

  it('rejects a score outside 0–10 and unknown sort/order values', () => {
    expect(animeFiltersParamsSchema.safeParse({ scoreMin: '11' }).success).toBe(
      false
    )
    expect(
      animeFiltersParamsSchema.safeParse({ sort: 'popularity' }).success
    ).toBe(false)
    expect(animeFiltersParamsSchema.safeParse({ order: 'up' }).success).toBe(
      false
    )
  })
})

describe('animeListRequestSchema — boundary refinements', () => {
  it('rejects scoreMin greater than scoreMax', () => {
    expect(query({ scoreMin: '8', scoreMax: '5' }).success).toBe(false)
  })

  it('accepts an equal score range', () => {
    expect(query({ scoreMin: '5', scoreMax: '5' }).success).toBe(true)
  })

  it('rejects relevance sort without a usable query', () => {
    expect(query({ sort: 'relevance' }).success).toBe(false)
    expect(query({ sort: 'relevance', query: '   ' }).success).toBe(false)
  })

  it('accepts relevance sort with a non-empty query', () => {
    expect(query({ sort: 'relevance', query: 'cowboy' }).success).toBe(true)
  })

  it('stays backward compatible with only pre-existing params', () => {
    const res = query({ genre: 'Action', year: '2024', query: 'naruto' })
    expect(res.success).toBe(true)
  })
})
