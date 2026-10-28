/**
 * Integration test for the anime list `producer` filter against a real Postgres.
 *
 * @module domains/anime/__tests__/repositories/anime-list-producer.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); seeds and removes its own probe rows.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const STUDIO_ID = 999_007_001
const STUDIO_ANIME_ID = 999_007_011
const PRODUCED_ANIME_ID = 999_007_012

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('anime list producer filter (integration)', () => {
  let pool: PgPool
  let repo: typeof import('@anime/repositories/anime-list')['animeListRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    repo = (await import('@anime/repositories/anime-list')).animeListRepository
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO producer (mal_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [STUDIO_ID]
    )
    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'Studio Probe','TV'),($2,'Producer Probe','TV')
       ON CONFLICT (mal_id) DO NOTHING`,
      [STUDIO_ANIME_ID, PRODUCED_ANIME_ID]
    )
    await pool.query(
      `INSERT INTO anime_producer (anime_id, producer_id, role)
       VALUES ($1,$3,'studio'),($2,$3,'producer') ON CONFLICT DO NOTHING`,
      [STUDIO_ANIME_ID, PRODUCED_ANIME_ID, STUDIO_ID]
    )
  })

  afterAll(async () => {
    await pool.query('DELETE FROM anime WHERE mal_id IN ($1,$2)', [
      STUDIO_ANIME_ID,
      PRODUCED_ANIME_ID,
    ])
    await pool.query('DELETE FROM producer WHERE mal_id = $1', [STUDIO_ID])
    await pool.end()
  })

  const ids = async (producerRole?: 'studio') =>
    (
      await repo.getAnimeList({
        page: 1,
        limit: 10,
        producer: [STUDIO_ID],
        producerRole,
      })
    ).map((row) => row.malId)

  it('returns every anime credited to the producer', async () => {
    expect((await ids()).sort()).toEqual([STUDIO_ANIME_ID, PRODUCED_ANIME_ID])
  })

  it('keeps only the requested role', async () => {
    expect(await ids('studio')).toEqual([STUDIO_ANIME_ID])
  })
})
