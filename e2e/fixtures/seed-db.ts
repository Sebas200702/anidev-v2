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
import {
  SEED_ANIME,
  SEED_ANIME_MAL_ID,
  SEED_EPISODES,
  SEED_GENRE_MAL_ID,
  SEED_GENRE_NAME,
  SEED_MANGA_MAL_ID,
  SEED_MANGA_SYNONYM,
  SEED_MANGA_TITLE,
  SEED_MUSIC,
  SEED_PRODUCER_MAL_ID,
  SEED_PRODUCER_NAME,
} from './seed-data'
import { seedPeople } from './seed-people'
import { seedProfileImages } from './seed-profile-images'

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

    await pool.query(
      `INSERT INTO genre (mal_id, name) VALUES ($1, $2)
       ON CONFLICT (mal_id) DO UPDATE SET name = EXCLUDED.name`,
      [SEED_GENRE_MAL_ID, SEED_GENRE_NAME]
    )
    await pool.query(
      `INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [SEED_ANIME_MAL_ID, SEED_GENRE_MAL_ID]
    )

    // One statement for every episode row instead of a query per row.
    await pool.query(
      `INSERT INTO episode (anime_id, number, title, synopsis)
       SELECT $1, number, title, synopsis
       FROM unnest($2::int[], $3::text[], $4::text[]) AS e(number, title, synopsis)
       ON CONFLICT (anime_id, number) DO UPDATE SET
         title = EXCLUDED.title, synopsis = EXCLUDED.synopsis`,
      [
        SEED_ANIME_MAL_ID,
        SEED_EPISODES.map(({ number }) => number),
        SEED_EPISODES.map(({ title }) => title),
        SEED_EPISODES.map(({ synopsis }) => synopsis),
      ]
    )

    await pool.query(
      `INSERT INTO manga (mal_id, type, title, status, year, score, synopsis)
       VALUES ($1, 'manga', $2, 'Finished', 2001, 8.5, 'Seeded printed work.')
       ON CONFLICT (mal_id) DO UPDATE SET title = EXCLUDED.title`,
      [SEED_MANGA_MAL_ID, SEED_MANGA_TITLE]
    )
    await pool.query(
      `INSERT INTO manga_title_synonym (manga_id, title) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [SEED_MANGA_MAL_ID, SEED_MANGA_SYNONYM]
    )
    await pool.query(
      `INSERT INTO manga_genre (manga_id, genre_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [SEED_MANGA_MAL_ID, SEED_GENRE_MAL_ID]
    )

    await pool.query(
      `INSERT INTO producer (mal_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [SEED_PRODUCER_MAL_ID]
    )
    await pool.query(
      `INSERT INTO producer_title (producer_id, type, title)
       VALUES ($1, 'Default', $2) ON CONFLICT DO NOTHING`,
      [SEED_PRODUCER_MAL_ID, SEED_PRODUCER_NAME]
    )
    await pool.query(
      `INSERT INTO anime_producer (anime_id, producer_id, role)
       VALUES ($1, $2, 'studio') ON CONFLICT DO NOTHING`,
      [SEED_ANIME_MAL_ID, SEED_PRODUCER_MAL_ID]
    )
    await pool.query(
      `INSERT INTO manga_producer (manga_id, producer_id, role)
       VALUES ($1, $2, 'serialization') ON CONFLICT DO NOTHING`,
      [SEED_MANGA_MAL_ID, SEED_PRODUCER_MAL_ID]
    )

    for (const music of SEED_MUSIC) {
      await pool.query(
        `INSERT INTO music (id, title, type)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type`,
        [music.id, music.title, music.type]
      )
    }

    await seedPeople(pool)
    await seedProfileImages(pool)
  } finally {
    await pool.end()
  }
}

try {
  await seedE2eDatabase()
  console.log(
    `E2E seed complete: ${SEED_ANIME.length} anime, ${SEED_EPISODES.length} episodes, ${SEED_MUSIC.length} music, 1 manga, 1 producer`
  )
} catch (error) {
  console.error('E2E seed failed:', error)
  process.exit(1)
}
