/**
 * Integration tests for {@link animeEpisodesRepository} against a real Postgres.
 *
 * @module domains/anime/__tests__/repositories/anime-episodes.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Self-seeding in a reserved id range (`999_007_xxx`); fixtures are removed
 * in `afterAll`. Proves the SQL the unit tests stub: ordering by number regardless of insert order,
 * LIMIT/OFFSET paging, the count, and the `(anime_id, number)` detail lookup.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run anime-episodes.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const ANIME = 999_007_101

describe.skipIf(!enabled)('animeEpisodesRepository (integration)', () => {
  let pool: PgPool
  let repo: typeof import('@anime/repositories/anime-episodes')['animeEpisodesRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'E2E Episodes Anime','TV') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME]
    )
    // Inserted out of order on purpose: the repository must order by number.
    for (const number of [3, 1, 2]) {
      await pool.query(
        `INSERT INTO episode (anime_id, number, title, synopsis) VALUES ($1,$2,$3,$4)
         ON CONFLICT DO NOTHING`,
        [ANIME, number, `Episode ${number}`, `Synopsis ${number}`]
      )
    }
    ;({ animeEpisodesRepository: repo } = await import(
      '@anime/repositories/anime-episodes'
    ))
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM anime WHERE mal_id = $1', [ANIME])
    await pool.end()
  })

  it('pages episodes ordered by number', async () => {
    const first = await repo.getEpisodesPage({
      malId: ANIME,
      page: 1,
      limit: 2,
    })
    const second = await repo.getEpisodesPage({
      malId: ANIME,
      page: 2,
      limit: 2,
    })

    expect(first.map((row) => row.number)).toEqual([1, 2])
    expect(second.map((row) => row.number)).toEqual([3])
  })

  it('returns an empty page past the end', async () => {
    const rows = await repo.getEpisodesPage({ malId: ANIME, page: 5, limit: 2 })
    expect(rows).toEqual([])
  })

  it('counts the anime episodes', async () => {
    expect(await repo.countEpisodes(ANIME)).toBe(3)
    expect(await repo.countEpisodes(ANIME + 1)).toBe(0)
  })

  it('finds one episode by number', async () => {
    const row = await repo.getEpisodeByNumber(ANIME, 2)
    expect(row).toMatchObject({ number: 2, synopsis: 'Synopsis 2' })
    expect(await repo.getEpisodeByNumber(ANIME, 99)).toBeUndefined()
  })
})
