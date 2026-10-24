/**
 * Unit tests for the `producer` / `producerRole` anime list filter.
 *
 * @module domains/anime/__tests__/repositories/anime-list-producer-filter
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { DATABASE_URL: 'postgres://test:test@localhost:5432/test' },
}))

const { and } = await import('drizzle-orm')
const { db } = await import('@db/client')
const { anime } = await import('@db/schemas/anime')
const { buildAnimeListFilters } = await import(
  '@anime/repositories/anime-list/filters'
)
const { mapAnimeFilters } = await import('@anime/mappers/anime-filters')
const { animeFiltersParamsSchema } = await import(
  '@anime/schemas/anime-list-schema'
)

const toSql = (filters: Parameters<typeof buildAnimeListFilters>[0]) =>
  db
    .select()
    .from(anime)
    .where(and(...buildAnimeListFilters(filters)))
    .toSQL()

describe('anime list producer filter', () => {
  it('restricts to anime credited to the producers in the given role', () => {
    const { sql, params } = toSql({
      producer: [14, 43],
      producerRole: 'studio',
      parentalVariant: 'full',
    })
    expect(sql).toContain('"anime_producer"')
    expect(params).toEqual(expect.arrayContaining([14, 43, 'studio']))
  })

  it('omits the role condition when no role is given', () => {
    const { params } = toSql({ producer: [14], parentalVariant: 'full' })
    expect(params).not.toContain('studio')
  })

  it('validates and maps the comma-separated ids', () => {
    const filters = mapAnimeFilters(
      animeFiltersParamsSchema.parse({
        producer: '14,43',
        producerRole: 'studio',
      })
    )
    expect(filters.producer).toEqual([14, 43])
    expect(filters.producerRole).toBe('studio')
  })

  it.each(['abc', '14,', '-1', '1,x'])('rejects producer=%s', (producer) => {
    expect(animeFiltersParamsSchema.safeParse({ producer }).success).toBe(false)
  })

  it('rejects an unknown role', () => {
    expect(
      animeFiltersParamsSchema.safeParse({ producerRole: 'serialization' })
        .success
    ).toBe(false)
  })
})
