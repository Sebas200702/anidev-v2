/**
 * Integration tests for the character repositories against a real Postgres.
 *
 * @module domains/people/__tests__/repositories/character.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); seeds and removes its own probe rows.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const CHARACTER_ID = 999_009_001
const PROVISIONAL_ID = 999_009_002
const ANIME_ID = 999_009_011
const ADULT_ANIME_ID = 999_009_012
const MANGA_ID = 999_009_021
const JP_ACTOR_ID = 999_009_031
const EN_ACTOR_ID = 999_009_032
const NAME = 'Zqxw Probe Character'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('character repositories (integration)', () => {
  let pool: PgPool
  let search: typeof import('@people/repositories/character-search')['characterSearchRepository']
  let profile: typeof import('@people/repositories/character-profile')['characterProfileRepository']
  let appearances: typeof import('@people/repositories/character-appearances')['characterAppearancesRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    search = (await import('@people/repositories/character-search'))
      .characterSearchRepository
    profile = (await import('@people/repositories/character-profile'))
      .characterProfileRepository
    appearances = (await import('@people/repositories/character-appearances'))
      .characterAppearancesRepository
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const q = (text: string, values: unknown[]) => pool.query(text, values)

    await q(
      `INSERT INTO character (mal_id, name, favorites) VALUES ($1,$2,10),($3,$4,99)
       ON CONFLICT (mal_id) DO UPDATE SET name = EXCLUDED.name`,
      [CHARACTER_ID, NAME, PROVISIONAL_ID, `Personaje ${PROVISIONAL_ID}`]
    )
    await q(
      `INSERT INTO anime (mal_id, title, type, rating) VALUES
       ($1,'Probe Safe Anime','TV','PG-13 - Teens 13 or older'),
       ($2,'Probe Adult Anime','TV','Rx - Hentai') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME_ID, ADULT_ANIME_ID]
    )
    await q(
      `INSERT INTO manga (mal_id, type, title) VALUES ($1,'manga','Probe Manga')
       ON CONFLICT (mal_id) DO NOTHING`,
      [MANGA_ID]
    )
    await q(
      `INSERT INTO anime_character (anime_id, character_id, role) VALUES
       ($1,$3,'MAIN'),($1,$3,'Main'),($2,$3,'Main') ON CONFLICT DO NOTHING`,
      [ANIME_ID, ADULT_ANIME_ID, CHARACTER_ID]
    )
    await q(
      `INSERT INTO manga_character (manga_id, character_id, role)
       VALUES ($1,$2,'Supporting') ON CONFLICT DO NOTHING`,
      [MANGA_ID, CHARACTER_ID]
    )
    await q(
      `INSERT INTO staff (mal_id, name) VALUES ($1,'Probe JP'),($2,'Probe EN')
       ON CONFLICT (mal_id) DO NOTHING`,
      [JP_ACTOR_ID, EN_ACTOR_ID]
    )
    await q(
      `INSERT INTO character_voice_actor (character_id, staff_id, language)
       VALUES ($1,$3,'English'),($1,$2,'Japanese') ON CONFLICT DO NOTHING`,
      [CHARACTER_ID, JP_ACTOR_ID, EN_ACTOR_ID]
    )
  })

  afterAll(async () => {
    await pool.query('DELETE FROM anime WHERE mal_id = ANY($1)', [
      [ANIME_ID, ADULT_ANIME_ID],
    ])
    await pool.query('DELETE FROM manga WHERE mal_id = $1', [MANGA_ID])
    await pool.query('DELETE FROM character WHERE mal_id = ANY($1)', [
      [CHARACTER_ID, PROVISIONAL_ID],
    ])
    await pool.query('DELETE FROM staff WHERE mal_id = ANY($1)', [
      [JP_ACTOR_ID, EN_ACTOR_ID],
    ])
    await pool.end()
  })

  it('finds the character by partial name, never a provisional one', async () => {
    const rows = await search.search({
      query: 'zqxw probe',
      page: 1,
      limit: 10,
    })
    expect(rows.map((r) => r.malId)).toEqual([CHARACTER_ID])
    expect(await search.count('zqxw probe')).toBe(1)
    expect(await search.count('Personaje 99900')).toBe(0)
  })

  it('hides the provisional character profile', async () => {
    expect(await profile.getCharacter(PROVISIONAL_ID)).toBeUndefined()
    expect((await profile.getCharacter(CHARACTER_ID))?.name).toBe(NAME)
  })

  it('lists voice actors Japanese first', async () => {
    const voices = await profile.getVoiceActors(CHARACTER_ID)
    expect(voices.map((v) => v.language)).toEqual(['Japanese', 'English'])
  })

  it('dedupes role casing, keeps the safe floor and ranks main first', async () => {
    const rows = await appearances.getAppearances(CHARACTER_ID, {
      page: 1,
      limit: 10,
    })
    expect(rows.map((r) => [r.medium, r.malId])).toEqual([
      ['anime', ANIME_ID],
      ['manga', MANGA_ID],
    ])
    expect(await appearances.count(CHARACTER_ID)).toBe(2)
  })
})
