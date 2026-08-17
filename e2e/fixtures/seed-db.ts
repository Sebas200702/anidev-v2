/**
 * Idempotent E2E database seed.
 *
 * @module e2e/fixtures/seed-db
 * @remarks
 * Upserts the {@link module:e2e/fixtures/seed-data} rows via raw SQL (no ORM /
 * alias resolution needed, so it runs cleanly under `tsx`). Safe to re-run: a
 * fresh CI database and a populated local database both converge to the same
 * known rows. Reads `DATABASE_URL` from the environment (Bun `.env` locally, job
 * env in CI).
 *
 * Usage: `bun run db:seed:e2e`
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { SEED_ANIME, SEED_MUSIC } from './seed-data'

/**
 * Upserts the canonical E2E dataset into the target Postgres database.
 *
 * @throws When `DATABASE_URL` is unset or a statement fails.
 */
export async function seedE2eDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the E2E database')
  }

  const pool = new Pool({ connectionString })
  try {
    for (const anime of SEED_ANIME) {
      await pool.query(
        `INSERT INTO anime (mal_id, title, type, status, score, year, season, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (mal_id) DO UPDATE SET
           title = EXCLUDED.title, type = EXCLUDED.type, status = EXCLUDED.status,
           score = EXCLUDED.score, year = EXCLUDED.year, season = EXCLUDED.season,
           rating = EXCLUDED.rating`,
        [
          anime.malId,
          anime.title,
          anime.type,
          anime.status,
          anime.score,
          anime.year,
          anime.season,
          anime.rating,
        ]
      )
    }

    for (const music of SEED_MUSIC) {
      await pool.query(
        `INSERT INTO music (id, title, type)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type`,
        [music.id, music.title, music.type]
      )
    }
  } finally {
    await pool.end()
  }
}

try {
  await seedE2eDatabase()
  console.log(
    `E2E seed complete: ${SEED_ANIME.length} anime, ${SEED_MUSIC.length} music`
  )
} catch (error) {
  console.error('E2E seed failed:', error)
  process.exit(1)
}
