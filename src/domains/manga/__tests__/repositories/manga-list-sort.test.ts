import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { DATABASE_URL: 'postgres://test:test@localhost:5432/test' },
}))

const { db } = await import('@db/client')
const { manga } = await import('@db/schemas/manga')
const { buildMangaListSort } = await import(
  '@manga/repositories/manga-list/sort'
)

const toOrderSql = (filters: Parameters<typeof buildMangaListSort>[0]) =>
  db
    .select()
    .from(manga)
    .orderBy(...buildMangaListSort(filters))
    .toSQL()
    .sql.toLowerCase()

describe('buildMangaListSort — deterministic ordering', () => {
  it('orders by the requested field then the malId tiebreaker', () => {
    const sql = toOrderSql({ sort: 'title', order: 'asc' })
    expect(sql).toMatch(/order by "manga"\."title" asc, "manga"\."mal_id" asc/)
  })

  it('defaults to score desc with the malId tiebreaker', () => {
    const sql = toOrderSql({})
    expect(sql).toMatch(/order by "manga"\."score" desc, "manga"\."mal_id" asc/)
  })

  it('honors desc on year', () => {
    const sql = toOrderSql({ sort: 'year', order: 'desc' })
    expect(sql).toMatch(/order by "manga"\."year" desc/)
  })
})
