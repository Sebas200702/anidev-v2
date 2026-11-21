/**
 * SQL-generation unit tests for the anime-list ORDER BY builder.
 *
 * @module domains/anime/__tests__/repositories/anime-list-sort
 * @remarks
 * Validates generated SQL offline via Drizzle `.toSQL()` (no DB connection).
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { DATABASE_URL: 'postgres://test:test@localhost:5432/test' },
}))

const { db } = await import('@db/client')
const { anime } = await import('@db/schemas/anime')
const { buildAnimeListSort } = await import(
  '@anime/repositories/anime-list/sort'
)

const toOrderSql = (filters: Parameters<typeof buildAnimeListSort>[0]) =>
  db
    .select()
    .from(anime)
    .orderBy(...buildAnimeListSort(filters))
    .toSQL()
    .sql.toLowerCase()

describe('buildAnimeListSort — deterministic ordering', () => {
  it('orders by the requested field then the malId secondary key', () => {
    const sql = toOrderSql({ sort: 'year', order: 'asc' })

    expect(sql).toContain('order by')
    expect(sql).toContain('"year"')
    expect(sql).toContain('"mal_id"')
  })

  it('defaults to score desc with the malId tiebreaker', () => {
    const sql = toOrderSql({})

    expect(sql).toContain('"score"')
    expect(sql).toContain('"mal_id"')
    expect(sql).toContain('desc')
  })

  it('orders relevance sort by the sim_rank select alias', () => {
    const sql = toOrderSql({ sort: 'relevance', query: 'cowboy' })

    expect(sql).toContain('sim_rank')
    expect(sql).toContain('"mal_id"')
  })
})

describe('buildAnimeListSort — null placement', () => {
  it('pushes unscored anime after scored ones on the default sort', () => {
    expect(toOrderSql({})).toMatch(/"score" desc nulls last/)
  })

  it('keeps nulls last when the order is ascending', () => {
    expect(toOrderSql({ sort: 'year', order: 'asc' })).toMatch(
      /"year" asc nulls last/
    )
  })
})
