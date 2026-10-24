/**
 * Integration tests for the person repositories against a real Postgres.
 *
 * @module domains/people/__tests__/repositories/person.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); seeds and removes its own probe rows.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const PERSON_ID = 999_010_001
const SAFE_CHAR = 999_010_011
const ADULT_ONLY_CHAR = 999_010_012
const SAFE_ANIME = 999_010_021
const ADULT_ANIME = 999_010_022
const MANGA_ID = 999_010_031
const MUSIC_ID = 999_010_041
const NAME = 'Zqxw Probe Person'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('person repositories (integration)', () => {
  let pool: PgPool
  let artistId: number
  let repos: {
    search: typeof import('@people/repositories/person-search')['personSearchRepository']
    profile: typeof import('@people/repositories/person-profile')['personProfileRepository']
    voices: typeof import('@people/repositories/person-voices')['personVoicesRepository']
    credits: typeof import('@people/repositories/person-credits')['personCreditsRepository']
  }

  beforeAll(async () => {
    await import('dotenv/config')
    repos = {
      search: (await import('@people/repositories/person-search'))
        .personSearchRepository,
      profile: (await import('@people/repositories/person-profile'))
        .personProfileRepository,
      voices: (await import('@people/repositories/person-voices'))
        .personVoicesRepository,
      credits: (await import('@people/repositories/person-credits'))
        .personCreditsRepository,
    }
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const q = (text: string, values: unknown[] = []) => pool.query(text, values)

    await q(
      `INSERT INTO staff (mal_id, name) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [PERSON_ID, NAME]
    )
    await q(
      `INSERT INTO anime (mal_id, title, type, rating, year) VALUES
       ($1,'Probe Safe','TV','PG-13 - Teens 13 or older',2020),($2,'Probe Adult','TV','Rx - Hentai',2021)
       ON CONFLICT (mal_id) DO NOTHING`,
      [SAFE_ANIME, ADULT_ANIME]
    )
    await q(
      `INSERT INTO manga (mal_id, type, title) VALUES ($1,'manga','Probe Manga') ON CONFLICT DO NOTHING`,
      [MANGA_ID]
    )
    await q(
      `INSERT INTO character (mal_id, name) VALUES ($1,'Probe Safe Char'),($2,'Probe Adult Char')
       ON CONFLICT DO NOTHING`,
      [SAFE_CHAR, ADULT_ONLY_CHAR]
    )
    await q(
      `INSERT INTO anime_character (anime_id, character_id, role) VALUES ($1,$3,'Main'),($2,$4,'Main')
       ON CONFLICT DO NOTHING`,
      [SAFE_ANIME, ADULT_ANIME, SAFE_CHAR, ADULT_ONLY_CHAR]
    )
    await q(
      `INSERT INTO character_voice_actor (character_id, staff_id, language) VALUES
       ($1,$3,'Japanese'),($1,$3,'English'),($2,$3,'Japanese') ON CONFLICT DO NOTHING`,
      [SAFE_CHAR, ADULT_ONLY_CHAR, PERSON_ID]
    )
    await q(
      `INSERT INTO anime_staff (anime_id, staff_id, role) VALUES
       ($1,$3,'Director'),($1,$3,'Storyboard'),($2,$3,'Director') ON CONFLICT DO NOTHING`,
      [SAFE_ANIME, ADULT_ANIME, PERSON_ID]
    )
    await q(
      `INSERT INTO manga_staff (manga_id, staff_id, role) VALUES ($1,$2,'Story') ON CONFLICT DO NOTHING`,
      [MANGA_ID, PERSON_ID]
    )
    await q(
      `INSERT INTO music (id, title, type) VALUES ($1,'Probe Theme','OP') ON CONFLICT DO NOTHING`,
      [MUSIC_ID]
    )
    const artist = await q(
      `INSERT INTO artist (name, mal_id) VALUES ('Zqxw Probe Artist', $1) RETURNING id`,
      [PERSON_ID]
    )
    artistId = artist.rows[0].id
    await q(`INSERT INTO music_artist (music_id, artist_id) VALUES ($1,$2)`, [
      MUSIC_ID,
      artistId,
    ])
  })

  afterAll(async () => {
    await pool.query('DELETE FROM music WHERE id = $1', [MUSIC_ID])
    await pool.query('DELETE FROM artist WHERE id = $1', [artistId])
    await pool.query('DELETE FROM anime WHERE mal_id = ANY($1)', [
      [SAFE_ANIME, ADULT_ANIME],
    ])
    await pool.query('DELETE FROM manga WHERE mal_id = $1', [MANGA_ID])
    await pool.query('DELETE FROM character WHERE mal_id = ANY($1)', [
      [SAFE_CHAR, ADULT_ONLY_CHAR],
    ])
    await pool.query('DELETE FROM staff WHERE mal_id = $1', [PERSON_ID])
    await pool.end()
  })

  it('finds the person by partial name', async () => {
    const rows = await repos.search.search({
      query: 'zqxw probe person',
      page: 1,
      limit: 5,
    })
    expect(rows.map((r) => r.malId)).toEqual([PERSON_ID])
  })

  it('counts every list with its own predicate', async () => {
    expect(await repos.profile.getCounts(PERSON_ID)).toEqual({
      voices: 2,
      animeCredits: 1,
      mangaCredits: 1,
      music: 1,
    })
  })

  it('lists voices per language, skipping adult-only characters', async () => {
    const rows = await repos.voices.getVoices(PERSON_ID, { page: 1, limit: 10 })
    expect(rows.map((r) => [r.characterId, r.language]).sort()).toEqual([
      [SAFE_CHAR, 'English'],
      [SAFE_CHAR, 'Japanese'],
    ])
    expect(rows[0].anime).toEqual([{ malId: SAFE_ANIME, title: 'Probe Safe' }])
    expect(await repos.voices.count(PERSON_ID, 'Japanese')).toBe(1)
  })

  it('groups positions per work and keeps the safe floor', async () => {
    const rows = await repos.credits.getCredits(PERSON_ID, {
      medium: 'anime',
      page: 1,
      limit: 10,
    })
    expect(rows).toEqual([
      {
        medium: 'anime',
        malId: SAFE_ANIME,
        title: 'Probe Safe',
        positions: ['Director', 'Storyboard'],
      },
    ])
    expect(await repos.credits.count(PERSON_ID, 'manga')).toBe(1)
  })

  it('resolves the linked music artist', async () => {
    expect(await repos.credits.getArtistIds(PERSON_ID)).toEqual([artistId])
  })
})
