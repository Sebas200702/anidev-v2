/**
 * Integration tests for the printed-media (manga) repositories against a real
 * Postgres.
 *
 * @module domains/manga/__tests__/repositories/manga-repositories.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set and `DATABASE_URL` points at a
 * reachable Postgres with the migrations applied. Skipped in the default unit
 * gate (no DB) and enabled locally / in a CI service container.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run manga-repositories.integration`
 */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const PROBE_ID = 999_006_101
const PROBE_TERM = 'Zqxw Unique Manga Synonym'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('manga repositories (integration)', () => {
  let mangaListRepository: typeof import('@manga/repositories/manga-list')['mangaListRepository']
  let mangaDetailsRepository: typeof import('@manga/repositories/manga-details')['mangaDetailsRepository']
  let pool: PgPool

  beforeAll(async () => {
    await import('dotenv/config')
    const list = await import('@manga/repositories/manga-list')
    const details = await import('@manga/repositories/manga-details')
    mangaListRepository = list.mangaListRepository
    mangaDetailsRepository = details.mangaDetailsRepository

    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO manga (mal_id, type, title, status, year, chapters, synopsis)
       VALUES ($1,'manga','Synonym Probe Manga','Finished',2020,10,'probe')
       ON CONFLICT (mal_id) DO UPDATE SET title = EXCLUDED.title`,
      [PROBE_ID]
    )
    await pool.query(
      `INSERT INTO manga_title_synonym (manga_id, title) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [PROBE_ID, PROBE_TERM]
    )
  })

  it('matches a work by its synonym', async () => {
    const rows = await mangaListRepository.getMangaList({
      page: 1,
      limit: 10,
      query: 'zqxw unique',
    })
    expect(rows.some((r) => r.malId === PROBE_ID)).toBe(true)
  })

  it('filters by type', async () => {
    const rows = await mangaListRepository.getMangaList({
      page: 1,
      limit: 10,
      type: ['manga'],
    })
    expect(rows.every((r) => r.type === 'manga')).toBe(true)
  })

  it('counts the works matching the filters', async () => {
    const total = await mangaListRepository.countMangaList({
      page: 1,
      limit: 10,
      type: ['manga'],
    })
    expect(total).toBeGreaterThan(0)
  })

  it('returns the work detail with its taxonomy', async () => {
    const work = await mangaDetailsRepository.getManga(PROBE_ID)
    expect(work?.title).toBe('Synonym Probe Manga')

    const genres = await mangaDetailsRepository.getGenres(PROBE_ID)
    expect(Array.isArray(genres)).toBe(true)

    const links = await mangaDetailsRepository.getExternalLinks(PROBE_ID)
    expect(Array.isArray(links)).toBe(true)
  })

  it('returns null for an unknown work', async () => {
    const work = await mangaDetailsRepository.getManga(999_999_998)
    expect(work).toBeNull()
  })
})
