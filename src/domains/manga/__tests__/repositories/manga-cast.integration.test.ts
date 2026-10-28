/**
 * Integration tests for the printed-media cast and coverage against a real
 * Postgres.
 *
 * @module domains/manga/__tests__/repositories/manga-cast.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Seeds a fully populated probe work and checks:
 * - **promotion** — a character still named `Personaje <id>` never reaches
 *   the cast, while the real one keeps its voice actors;
 * - **coverage** — the detail rows expose cover, synopsis, taxonomy and cast.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const MANGA_ID = 999_006_201
const REAL_CHARACTER_ID = 999_006_202
const PROVISIONAL_CHARACTER_ID = 999_006_203
const VOICE_STAFF_ID = 999_006_204
const GENRE_ID = 999_006_205

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('manga cast and coverage (integration)', () => {
  let pool: PgPool
  let cast: typeof import('@manga/repositories/manga-cast')['mangaCastRepository']
  let taxonomy: typeof import('@manga/repositories/manga-taxonomy')['mangaTaxonomyRepository']
  let details: typeof import('@manga/repositories/manga-details')['mangaDetailsRepository']
  let media: typeof import('@media/repositories')['mangaMediaRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    cast = (await import('@manga/repositories/manga-cast')).mangaCastRepository
    taxonomy = (await import('@manga/repositories/manga-taxonomy'))
      .mangaTaxonomyRepository
    details = (await import('@manga/repositories/manga-details'))
      .mangaDetailsRepository
    media = (await import('@media/repositories')).mangaMediaRepository

    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const run = (sql: string, params: unknown[]) => pool.query(sql, params)

    await run(
      `INSERT INTO manga (mal_id, type, title, status, year, synopsis)
       VALUES ($1,'manga','Cast Probe Manga','Finished',2020,'A probe synopsis.')
       ON CONFLICT (mal_id) DO UPDATE SET synopsis = EXCLUDED.synopsis`,
      [MANGA_ID]
    )
    await run(
      `INSERT INTO character (mal_id, name) VALUES ($1,'Real Probe'),($2,$3)
       ON CONFLICT (mal_id) DO UPDATE SET name = EXCLUDED.name`,
      [
        REAL_CHARACTER_ID,
        PROVISIONAL_CHARACTER_ID,
        `Personaje ${PROVISIONAL_CHARACTER_ID}`,
      ]
    )
    await run(
      `INSERT INTO manga_character (manga_id, character_id, role)
       VALUES ($1,$2,'Main'),($1,$3,'Supporting') ON CONFLICT DO NOTHING`,
      [MANGA_ID, REAL_CHARACTER_ID, PROVISIONAL_CHARACTER_ID]
    )
    await run(
      `INSERT INTO staff (mal_id, name) VALUES ($1,'Voice Probe')
       ON CONFLICT (mal_id) DO NOTHING`,
      [VOICE_STAFF_ID]
    )
    await run(
      `INSERT INTO character_voice_actor (character_id, staff_id, language)
       VALUES ($1,$2,'Japanese') ON CONFLICT DO NOTHING`,
      [REAL_CHARACTER_ID, VOICE_STAFF_ID]
    )
    await run(
      `INSERT INTO genre (mal_id, name) VALUES ($1,'Probe Genre')
       ON CONFLICT (mal_id) DO NOTHING`,
      [GENRE_ID]
    )
    await run(
      `INSERT INTO manga_genre (manga_id, genre_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [MANGA_ID, GENRE_ID]
    )
    await run(
      `INSERT INTO manga_media (manga_id, media_type, src)
       SELECT $1,'cover','https://example.com/probe.jpg'
       WHERE NOT EXISTS (SELECT 1 FROM manga_media WHERE manga_id = $1)`,
      [MANGA_ID]
    )
  })

  afterAll(async () => {
    await pool.query('DELETE FROM manga WHERE mal_id = $1', [MANGA_ID])
    await pool.query('DELETE FROM character WHERE mal_id IN ($1,$2)', [
      REAL_CHARACTER_ID,
      PROVISIONAL_CHARACTER_ID,
    ])
    await pool.query('DELETE FROM staff WHERE mal_id = $1', [VOICE_STAFF_ID])
    await pool.query('DELETE FROM genre WHERE mal_id = $1', [GENRE_ID])
    await pool.end()
  })

  it('keeps provisional character names out of the cast', async () => {
    const rows = await cast.getCharacters(MANGA_ID)
    expect(rows.map((r) => r.characterId)).toEqual([REAL_CHARACTER_ID])
  })

  it('loads the voice actors of the cast', async () => {
    const voices = await cast.getVoiceActors([REAL_CHARACTER_ID])
    expect(voices).toEqual([
      {
        characterId: REAL_CHARACTER_ID,
        staffId: VOICE_STAFF_ID,
        language: 'Japanese',
        name: 'Voice Probe',
      },
    ])
  })

  it('covers cover, synopsis, taxonomy and cast', async () => {
    const [work, genres, characters, assets] = await Promise.all([
      details.getManga(MANGA_ID),
      taxonomy.getGenres(MANGA_ID),
      cast.getCharacters(MANGA_ID),
      media.getMediaByMangaId(MANGA_ID),
    ])
    expect(work?.synopsis).toBe('A probe synopsis.')
    expect(genres.map((g) => g.name)).toEqual(['Probe Genre'])
    expect(characters).toHaveLength(1)
    expect(assets.some((a) => a.mediaType === 'cover')).toBe(true)
  })
})
