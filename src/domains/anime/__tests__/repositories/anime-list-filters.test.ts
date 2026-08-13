/**
 * SQL-generation unit tests for anime-list filter and sort builders.
 *
 * @module domains/anime/__tests__/repositories/anime-list-filters
 * @remarks
 * Validates generated SQL offline via Drizzle `.toSQL()` (no DB connection).
 * Index usage and execution are covered by CI integration tests against a real
 * Postgres service container.
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
const { buildAnimeListSort } = await import(
  '@anime/repositories/anime-list/sort'
)

describe('buildAnimeListFilters — season and score range', () => {
  it('emits equality on season and range bounds on score', () => {
    const conditions = buildAnimeListFilters({
      season: 'spring',
      scoreMin: 7,
      scoreMax: 9,
      parentalVariant: 'full',
    })
    const { sql, params } = db
      .select()
      .from(anime)
      .where(and(...conditions))
      .toSQL()

    expect(sql).toContain('"season"')
    expect(sql).toContain('"score"')
    expect(params).toContain('spring')
    expect(params).toContain(7)
    expect(params).toContain(9)
  })

  it('omits score bounds when not provided', () => {
    const conditions = buildAnimeListFilters({
      season: 'winter',
      parentalVariant: 'full',
    })
    const { params } = db
      .select()
      .from(anime)
      .where(and(...conditions))
      .toSQL()
    expect(params).toEqual(['winter'])
  })
})

describe('buildAnimeListFilters — parental floor', () => {
  it('safe variant excludes adult ratings while keeping unknown (null) ratings', () => {
    const conditions = buildAnimeListFilters({ parentalVariant: 'safe' })
    const { sql } = db
      .select()
      .from(anime)
      .where(and(...conditions))
      .toSQL()

    expect(sql).toContain('"rating"')
    expect(sql.toLowerCase()).toContain('not in')
    expect(sql.toLowerCase()).toContain('is null')
  })

  it('applies the safe floor when the variant is unset (fail-closed)', () => {
    expect(buildAnimeListFilters({}).length).toBe(1)
  })

  it('full variant does not restrict ratings', () => {
    expect(buildAnimeListFilters({ parentalVariant: 'full' }).length).toBe(0)
  })
})

describe('buildAnimeListSort — deterministic ordering', () => {
  it('orders by the requested field then the malId secondary key', () => {
    const { sql } = db
      .select()
      .from(anime)
      .orderBy(...buildAnimeListSort({ sort: 'year', order: 'asc' }))
      .toSQL()

    expect(sql.toLowerCase()).toContain('order by')
    expect(sql).toContain('"year"')
    expect(sql).toContain('"mal_id"')
  })

  it('defaults to score desc with the malId tiebreaker', () => {
    const { sql } = db
      .select()
      .from(anime)
      .orderBy(...buildAnimeListSort({}))
      .toSQL()
    expect(sql).toContain('"score"')
    expect(sql).toContain('"mal_id"')
    expect(sql.toLowerCase()).toContain('desc')
  })
})
