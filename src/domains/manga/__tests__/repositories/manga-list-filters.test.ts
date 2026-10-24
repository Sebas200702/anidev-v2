import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { DATABASE_URL: 'postgres://test:test@localhost:5432/test' },
}))

const { and } = await import('drizzle-orm')
const { db } = await import('@db/client')
const { manga } = await import('@db/schemas/manga')
const { buildMangaListConditions } = await import(
  '@manga/repositories/manga-list/filters'
)

describe('buildMangaListConditions', () => {
  it('emits type filter', () => {
    const conditions = buildMangaListConditions({
      type: ['manga'],
      parentalVariant: 'full',
    } as any)
    const { sql, params } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql).toContain('"type"')
    expect(params).toContain('manga')
  })

  it('emits score range', () => {
    const conditions = buildMangaListConditions({
      scoreMin: 7,
      scoreMax: 9,
      parentalVariant: 'full',
    } as any)
    const { sql, params } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql).toContain('"score"')
    expect(params).toContain(7)
    expect(params).toContain(9)
  })

  it('emits free-text ILIKE on titles and synonym subquery', () => {
    const conditions = buildMangaListConditions({
      query: 'zqxw',
      parentalVariant: 'full',
    } as any)
    const { sql, params } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql.toLowerCase()).toContain('ilike')
    expect(params).toContain('%zqxw%')
    expect(sql).toContain('manga_title_synonym')
  })

  it('safe parental variant excludes adult genres', () => {
    const conditions = buildMangaListConditions({
      parentalVariant: 'safe',
    } as any)
    const { sql } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql.toLowerCase()).toContain('not in')
  })

  it('filters by genre, theme, demographic, status and year', () => {
    const conditions = buildMangaListConditions({
      genre: ['Action'],
      theme: ['Ninja'],
      demographic: ['Shonen'],
      status: ['Finished'],
      year: 2002,
      parentalVariant: 'full',
    } as any)
    const { sql, params } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql).toContain('manga_genre')
    expect(sql).toContain('manga_theme')
    expect(sql).toContain('manga_demographic')
    expect(params).toContain('Finished')
    expect(params).toContain(2002)
  })

  it('full variant does not add parental floor', () => {
    const safe = buildMangaListConditions({ parentalVariant: 'safe' } as any)
    const full = buildMangaListConditions({ parentalVariant: 'full' } as any)
    expect(full.length).toBeLessThan(safe.length)
  })

  it('unset variant is fail-closed (safe)', () => {
    const unset = buildMangaListConditions({} as any)
    const safe = buildMangaListConditions({ parentalVariant: 'safe' } as any)
    expect(unset).toHaveLength(safe.length)
  })
})

describe('buildMangaListConditions — producer scope', () => {
  it('restricts to works linked to the producer', () => {
    const conditions = buildMangaListConditions({
      producerId: 1234,
      parentalVariant: 'full',
    } as any)
    const { sql, params } = db
      .select()
      .from(manga)
      .where(and(...conditions))
      .toSQL()
    expect(sql).toContain('"manga_producer"')
    expect(params).toContain(1234)
  })
})
