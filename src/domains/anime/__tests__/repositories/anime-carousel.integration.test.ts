/**
 * Integration tests for carousel eligibility and batched fan-outs.
 *
 * @module domains/anime/__tests__/repositories/anime-carousel.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set against a real Postgres with
 * migrations applied. Self-seeding with reserved ids (`999_004_xxx`) removed
 * in `afterAll`. Proves the set-based eligibility SQL (both banner+clearlogo
 * required) and the single-query batched fan-outs.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const A = 999_004_101
const B = 999_004_102
const GENRE = 999_004_201

describe.skipIf(!enabled)('anime carousel (integration)', () => {
  let pool: PgPool
  let carousel: typeof import('@anime/repositories/anime-carousel')['animeCarouselRepository']
  let taxonomy: typeof import('@anime/repositories/anime-taxonomy')['animeTaxonomyRepository']
  let media: typeof import('@media/repositories/anime-media')['animeMediaRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type, status, score, popularity_rank)
       VALUES ($1,'Carousel Eligible','TV','Finished Airing',8.0,1),
              ($2,'Carousel Partial','TV','Finished Airing',9.0,2)
       ON CONFLICT (mal_id) DO NOTHING`,
      [A, B]
    )
    await pool.query(
      `INSERT INTO anime_media (anime_id, media_type, src, size) VALUES
         ($1,'banner','https://cdn/a-banner.jpg','large'),
         ($1,'clearlogo','https://cdn/a-logo.png','large'),
         ($2,'banner','https://cdn/b-banner.jpg','large')
       ON CONFLICT DO NOTHING`,
      [A, B]
    )
    await pool.query(
      `INSERT INTO genre (mal_id, name) VALUES ($1,'Carousel Genre') ON CONFLICT (mal_id) DO NOTHING`,
      [GENRE]
    )
    await pool.query(
      `INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [A, GENRE]
    )

    const carouselMod = await import('@anime/repositories/anime-carousel')
    const taxonomyMod = await import('@anime/repositories/anime-taxonomy')
    const mediaMod = await import('@media/repositories/anime-media')
    carousel = carouselMod.animeCarouselRepository
    taxonomy = taxonomyMod.animeTaxonomyRepository
    media = mediaMod.animeMediaRepository
  })

  afterAll(async () => {
    await pool.query(`DELETE FROM anime_genre WHERE anime_id IN ($1,$2)`, [
      A,
      B,
    ])
    await pool.query(`DELETE FROM genre WHERE mal_id = $1`, [GENRE])
    await pool.query(`DELETE FROM anime_media WHERE anime_id IN ($1,$2)`, [
      A,
      B,
    ])
    await pool.query(`DELETE FROM anime WHERE mal_id IN ($1,$2)`, [A, B])
    await pool.end()
  })

  it('returns only anime having every required media type', async () => {
    const rows = await carousel.getTopPopularWithMedia(6)
    const ids = rows.map((row) => row.malId)
    expect(ids).toContain(A)
    expect(ids).not.toContain(B)
  })

  it('batches genres for several anime in one call', async () => {
    const rows = await taxonomy.getGenresByAnimeIds([A, B])
    expect(rows.filter((row) => row.animeId === A)).toHaveLength(1)
    expect(rows.filter((row) => row.animeId === B)).toHaveLength(0)
  })

  it('batches media for several anime in one call', async () => {
    const rows = await media.getMediaByAnimeIds([A, B])
    expect(rows.filter((row) => row.animeId === A)).toHaveLength(2)
    expect(rows.filter((row) => row.animeId === B)).toHaveLength(1)
  })
})
