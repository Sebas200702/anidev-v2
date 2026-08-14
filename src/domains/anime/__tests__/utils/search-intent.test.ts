/**
 * Unit tests for the anime search-intent predicate.
 *
 * @module domains/anime/__tests__/utils/search-intent
 */
import { describe, expect, it } from 'vitest'
import { hasSearchIntent } from '@anime/utils'
import type { AnimeFiltersParams } from '@anime/types'

const base: AnimeFiltersParams = { page: 1, limit: 10 }

describe('hasSearchIntent', () => {
  it('is false for plain pagination', () => {
    expect(hasSearchIntent(base)).toBe(false)
  })

  it('is false when sort/order are set without a filter', () => {
    expect(hasSearchIntent({ ...base, sort: 'score', order: 'desc' })).toBe(
      false
    )
  })

  it('is false for a blank/whitespace query', () => {
    expect(hasSearchIntent({ ...base, query: '   ' })).toBe(false)
  })

  it('is true for a free-text query', () => {
    expect(hasSearchIntent({ ...base, query: 'bebop' })).toBe(true)
  })

  it('is true for a discovery filter', () => {
    expect(hasSearchIntent({ ...base, genre: 'Action' })).toBe(true)
    expect(hasSearchIntent({ ...base, scoreMin: 8 })).toBe(true)
    expect(hasSearchIntent({ ...base, year: 1998 })).toBe(true)
  })
})
