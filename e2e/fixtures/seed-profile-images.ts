/**
 * E2E seed for profile gallery picks: one safe anime with banner media.
 *
 * @module e2e/fixtures/seed-profile-images
 * @remarks
 * The banner goes on the second seeded anime ("Beta"), which no other spec
 * asserts media for. A banner alone does not make it carousel-eligible (that
 * also needs a clear logo), so the home carousel is unaffected.
 */
import type { Pool } from 'pg'

/** Seeded anime (safe rating) whose banner can be picked as profile banner. */
export const SEED_BANNER_ANIME_MAL_ID = 999_000_002

/**
 * Upserts the banner row of {@link SEED_BANNER_ANIME_MAL_ID}.
 *
 * @param pool - Open connection pool to the target database
 */
export async function seedProfileImages(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO anime_media (anime_id, media_type, src, size, source)
     VALUES ($1, 'banner', 'https://example.invalid/e2e-banner.jpg', 'large', 'e2e')
     ON CONFLICT DO NOTHING`,
    [SEED_BANNER_ANIME_MAL_ID]
  )
}
