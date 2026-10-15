/**
 * Integration tests for the anime list repository against a real Postgres.
 *
 * @module domains/anime/__tests__/repositories/anime-list.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set and `DATABASE_URL` points at a
 * reachable Postgres with the `pg_trgm` migration applied. Skipped in the default
 * unit gate (no DB) and enabled locally / in a CI service container.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run anime-list.integration`
 */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const PROBE_ID = 999_005_101
const PROBE_TERM = 'Zqxw Unique Synonym'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('animeListRepository (integration)', () => {
  let getAnimeList: typeof import('@anime/repositories/anime-list')['animeListRepository']['getAnimeList']

  beforeAll(async () => {
    await import('dotenv/config')
    const mod = await import('@anime/repositories/anime-list')
    getAnimeList = mod.animeListRepository.getAnimeList
  })

  it('free-text search returns index-backed matches ranked by relevance', async () => {
    const rows = await getAnimeList({
      page: 1,
      limit: 10,
      query: 'cowboy',
      sort: 'relevance',
      order: 'desc',
      parentalVariant: 'full',
    })

    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r) => /cowboy bebop/i.test(r.title))).toBe(true)
    // Relevance ranks the closest title first.
    expect(rows[0].title.toLowerCase()).toContain('cowboy bebop')
  })

  it('matches synonym-only titles via EXISTS', async () => {
    const { Pool } = await import('pg')
    const pool: PgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    try {
      await pool.query(
        `INSERT INTO anime (mal_id, title, type, status) VALUES ($1,'Synonym Probe Anime','TV','Finished Airing')
         ON CONFLICT (mal_id) DO NOTHING`,
        [PROBE_ID]
      )
      await pool.query(
        `INSERT INTO anime_title_synonym (anime_id, title) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [PROBE_ID, PROBE_TERM]
      )

      const { animeListRepository } = await import(
        '@anime/repositories/anime-list'
      )
      const rows = await animeListRepository.getAnimeList({
        page: 1,
        limit: 10,
        query: 'zqxw unique',
        parentalVariant: 'full',
      })
      expect(rows.some((r) => r.malId === PROBE_ID)).toBe(true)
    } finally {
      await pool.query(`DELETE FROM anime_title_synonym WHERE anime_id = $1`, [
        PROBE_ID,
      ])
      await pool.query(`DELETE FROM anime WHERE mal_id = $1`, [PROBE_ID])
      await pool.end()
    }
  })

  it('serves concurrent list and count reads consistently', async () => {
    // Scoped to the reserved probe term so parallel suites churning other
    // rows cannot flake the assertion; the pool must still serve 10 parallel
    // reads with identical results.
    const { Pool } = await import('pg')
    const pool: PgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    try {
      await pool.query(
        `INSERT INTO anime (mal_id, title, type, status) VALUES ($1,'Concurrency Probe Anime','TV','Finished Airing')
         ON CONFLICT (mal_id) DO NOTHING`,
        [PROBE_ID]
      )
      await pool.query(
        `INSERT INTO anime_title_synonym (anime_id, title) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [PROBE_ID, PROBE_TERM]
      )

      const { animeListRepository } = await import(
        '@anime/repositories/anime-list'
      )
      const filters = {
        page: 1,
        limit: 10,
        query: 'zqxw unique',
        parentalVariant: 'full',
      } as const
      const [lists, counts] = await Promise.all([
        Promise.all(
          Array.from({ length: 5 }, () =>
            animeListRepository.getAnimeList({ ...filters })
          )
        ),
        Promise.all(
          Array.from({ length: 5 }, () =>
            animeListRepository.getAnimeListCount({ ...filters })
          )
        ),
      ])

      for (const list of lists) {
        expect(list.map((r) => r.malId)).toEqual([PROBE_ID])
      }
      expect(new Set(counts)).toEqual(new Set([1]))
    } finally {
      await pool.query(`DELETE FROM anime_title_synonym WHERE anime_id = $1`, [
        PROBE_ID,
      ])
      await pool.query(`DELETE FROM anime WHERE mal_id = $1`, [PROBE_ID])
      await pool.end()
    }
  })

  it('safe parental variant excludes adult (Rx - Hentai) ratings', async () => {
    const rows = await getAnimeList({
      page: 1,
      limit: 100,
      parentalVariant: 'safe',
    })

    expect(rows.every((r) => r.rating !== 'Rx - Hentai')).toBe(true)
  })
})
