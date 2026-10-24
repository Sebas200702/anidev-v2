/**
 * Integration tests for {@link resolveMedia} against a real Postgres.
 *
 * @module domains/media/__tests__/services/resolve-media.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Self-seeding in a reserved id range (`999_005_xxx`); fixtures are removed
 * in `afterAll`. Validates that size/source fallback works end-to-end through the repository and
 * mapper layers.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run resolve-media.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MediaEntity, MediaSize, MediaType } from '@media/types'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const ANIME = 999_005_201

const PLACEHOLDER = '/placeholder.webp'

describe.skipIf(!enabled)('resolveMedia (integration)', () => {
  let pool: PgPool

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'E2E ResolveMedia Anime','TV') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME]
    )
    // Only a default/NULL-sized AniList poster exists, simulating the real scraper payload.
    await pool.query(
      `INSERT INTO anime_media (anime_id, media_type, src, size, source, priority)
       VALUES ($1,'poster','https://s4.anilist.co/file/anime/cover/large.jpg',NULL,'anilist',10)
       ON CONFLICT DO NOTHING`,
      [ANIME]
    )
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM anime_media WHERE anime_id = $1', [ANIME])
    await pool.query('DELETE FROM anime WHERE mal_id = $1', [ANIME])
    await pool.end()
  })

  it('falls back to default-sized asset when the requested size is missing', async () => {
    const { resolveMedia } = await import('@media/services/resolve-media')

    const result = await resolveMedia({
      entityType: MediaEntity.ANIME,
      entityId: ANIME,
      mediaType: MediaType.POSTER,
      mediaSize: MediaSize.LARGE,
    })

    expect(result.src).toContain('anilist.co')
    expect(result.src).not.toContain(PLACEHOLDER)
  })

  it('falls back through source mismatch to a real default-sized asset', async () => {
    const { resolveMedia } = await import('@media/services/resolve-media')

    // The API emits `?source=myanimelist` for these URLs, but the stored row is from AniList.
    const result = await resolveMedia(
      {
        entityType: MediaEntity.ANIME,
        entityId: ANIME,
        mediaType: MediaType.POSTER,
        mediaSize: MediaSize.SMALL,
      },
      'myanimelist'
    )

    expect(result.src).toContain('anilist.co')
    expect(result.src).not.toContain(PLACEHOLDER)
  })
})
