/**
 * E2E seed of the people domain: one character and one person.
 *
 * @module e2e/fixtures/seed-people
 * @remarks
 * Idempotent upserts over raw SQL, called from {@link seedE2eDatabase}. The
 * person voices the character (Japanese), directs the seeded anime and is
 * the artist of the first seeded theme, so every `/api/people` list has one
 * row.
 */
import type { Pool } from 'pg'
import {
  SEED_ANIME_MAL_ID,
  SEED_CHARACTER_MAL_ID,
  SEED_CHARACTER_NAME,
  SEED_MUSIC,
  SEED_PERSON_MAL_ID,
  SEED_PERSON_NAME,
} from './seed-data'

/**
 * Upserts the seeded character, person and their links.
 *
 * @param pool - Open connection pool to the target database
 */
export async function seedPeople(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO character (mal_id, name, favorites) VALUES ($1, $2, 1)
     ON CONFLICT (mal_id) DO UPDATE SET name = EXCLUDED.name`,
    [SEED_CHARACTER_MAL_ID, SEED_CHARACTER_NAME]
  )
  await pool.query(
    `INSERT INTO staff (mal_id, name, favorites) VALUES ($1, $2, 1)
     ON CONFLICT (mal_id) DO UPDATE SET name = EXCLUDED.name`,
    [SEED_PERSON_MAL_ID, SEED_PERSON_NAME]
  )
  await pool.query(
    `INSERT INTO anime_character (anime_id, character_id, role)
     VALUES ($1, $2, 'Main') ON CONFLICT DO NOTHING`,
    [SEED_ANIME_MAL_ID, SEED_CHARACTER_MAL_ID]
  )
  await pool.query(
    `INSERT INTO character_voice_actor (character_id, staff_id, language)
     VALUES ($1, $2, 'Japanese') ON CONFLICT DO NOTHING`,
    [SEED_CHARACTER_MAL_ID, SEED_PERSON_MAL_ID]
  )
  await pool.query(
    `INSERT INTO anime_staff (anime_id, staff_id, role)
     VALUES ($1, $2, 'Director') ON CONFLICT DO NOTHING`,
    [SEED_ANIME_MAL_ID, SEED_PERSON_MAL_ID]
  )
  const artist = await pool.query<{ id: number }>(
    `INSERT INTO artist (name, mal_id) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET mal_id = EXCLUDED.mal_id RETURNING id`,
    [SEED_PERSON_NAME, SEED_PERSON_MAL_ID]
  )
  await pool.query(
    `INSERT INTO music_artist (music_id, artist_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [SEED_MUSIC[0].id, artist.rows[0].id]
  )
}
