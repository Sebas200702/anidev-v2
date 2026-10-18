/**
 * Integration tests for the `anime_producer.role` discriminator against a real Postgres.
 *
 * @module lib/db/__tests__/anime-producer-role.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Self-seeding in a reserved id range (`999_006_xxx`); fixtures are removed
 * in `afterAll`. Proves the migrated schema (not a mock): the primary key is
 * `(anime_id, producer_id, role)`, `role` defaults to `'producer'`, and a role-filtered lookup can
 * use `anime_producer_role_idx`.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run anime-producer-role.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const ANIME = 999_006_101
const PRODUCER = 999_006_801

describe.skipIf(!enabled)('anime_producer role (integration)', () => {
  let pool: PgPool

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'E2E Producer Role Anime','TV') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME]
    )
    await pool.query(
      'INSERT INTO producer (mal_id) VALUES ($1) ON CONFLICT (mal_id) DO NOTHING',
      [PRODUCER]
    )
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM anime_producer WHERE anime_id = $1', [ANIME])
    await pool.query('DELETE FROM producer WHERE mal_id = $1', [PRODUCER])
    await pool.query('DELETE FROM anime WHERE mal_id = $1', [ANIME])
    await pool.end()
  })

  it('defaults role to producer when the writer omits it', async () => {
    await pool.query(
      'INSERT INTO anime_producer (anime_id, producer_id) VALUES ($1,$2)',
      [ANIME, PRODUCER]
    )

    const { rows } = await pool.query(
      'SELECT role FROM anime_producer WHERE anime_id = $1 AND producer_id = $2',
      [ANIME, PRODUCER]
    )
    expect(rows).toEqual([{ role: 'producer' }])
  })

  it('holds the same company under different roles', async () => {
    await pool.query(
      `INSERT INTO anime_producer (anime_id, producer_id, role) VALUES ($1,$2,'studio')`,
      [ANIME, PRODUCER]
    )

    const { rows } = await pool.query(
      'SELECT role FROM anime_producer WHERE anime_id = $1 AND producer_id = $2 ORDER BY role',
      [ANIME, PRODUCER]
    )
    expect(rows.map((row) => row.role)).toEqual(['producer', 'studio'])
  })

  it('rejects a duplicate (anime, producer, role) triple', async () => {
    await expect(
      pool.query(
        `INSERT INTO anime_producer (anime_id, producer_id, role) VALUES ($1,$2,'studio')`,
        [ANIME, PRODUCER]
      )
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('serves a role-filtered lookup from anime_producer_role_idx', async () => {
    const client = await pool.connect()
    try {
      // Seq scans are cheaper on a tiny table; disable them so the planner shows whether the
      // index is usable for this predicate at all.
      await client.query('SET enable_seqscan = off')
      const { rows } = await client.query(
        `EXPLAIN SELECT anime_id FROM anime_producer WHERE role = 'studio' AND producer_id = $1`,
        [PRODUCER]
      )
      const plan = rows.map((row) => row['QUERY PLAN']).join('\n')
      expect(plan).toContain('anime_producer_role_idx')
    } finally {
      await client.query('RESET enable_seqscan')
      client.release()
    }
  })
})
