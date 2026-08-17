/**
 * Integration tests for the anime domain repositories against a real Postgres.
 *
 * @module domains/anime/__tests__/repositories/anime-repositories.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set and `DATABASE_URL` points at a reachable Postgres
 * with migrations applied. Self-seeding — inserts its own fixtures in a reserved id range
 * (`999_00x_xxx`) in `beforeAll` and removes them in `afterAll`, so it never touches the shared e2e
 * seed. Validates the real SQL (joins, filters, projections) that the unit tests mock.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run anime-repositories.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

// Reserved ids that real MAL data never uses, so the fixtures are collision-safe.
const A = 999_001_101
const B = 999_001_102
const GENRE = 999_001_201
const THEME = 999_001_202
const DEMO = 999_001_203
const CHAR = 999_001_301
const STAFF = 999_001_401

describe.skipIf(!enabled)('anime repositories (integration)', () => {
  let pool: PgPool
  let repos: {
    anime: typeof import('@anime/repositories/anime')['animeRepository']
    taxonomy: typeof import('@anime/repositories/anime-taxonomy')['animeTaxonomyRepository']
    relations: typeof import('@anime/repositories/anime-relations')['animeRelationsRepository']
    title: typeof import('@anime/repositories/anime-title')['animeTitleRepository']
    external: typeof import('@anime/repositories/anime-external')['animeExternalRepository']
    characters: typeof import('@anime/repositories/anime-characters')['animeCharacterRepository']
    character: typeof import('@anime/repositories/character')['characterRepository']
    characterStaff: typeof import('@anime/repositories/character-staff')['characterStaffRepository']
    staff: typeof import('@anime/repositories/staff')['staffRepository']
    animeStaff: typeof import('@anime/repositories/anime-staff')['animeStaffRepository']
  }

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type, status, score, year, season, rating)
       VALUES ($1,'E2E Alpha','TV','Finished Airing',8.5,2020,'spring',NULL),
              ($2,'E2E Beta','Movie','Finished Airing',7.1,2021,NULL,NULL)
       ON CONFLICT (mal_id) DO NOTHING`,
      [A, B]
    )
    await pool.query(
      `INSERT INTO genre (mal_id, name) VALUES ($1,'E2E Genre') ON CONFLICT (mal_id) DO NOTHING`,
      [GENRE]
    )
    await pool.query(
      `INSERT INTO theme (mal_id, name) VALUES ($1,'E2E Theme') ON CONFLICT (mal_id) DO NOTHING`,
      [THEME]
    )
    await pool.query(
      `INSERT INTO demographic (mal_id, name) VALUES ($1,'E2E Demo') ON CONFLICT (mal_id) DO NOTHING`,
      [DEMO]
    )
    await pool.query(
      `INSERT INTO character (mal_id, name, name_kanji, about)
       VALUES ($1,'E2E Character','キャラ','About') ON CONFLICT (mal_id) DO NOTHING`,
      [CHAR]
    )
    await pool.query(
      `INSERT INTO staff (mal_id, name) VALUES ($1,'E2E Staff') ON CONFLICT (mal_id) DO NOTHING`,
      [STAFF]
    )

    await pool.query(
      `INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [A, GENRE]
    )
    await pool.query(
      `INSERT INTO anime_theme (anime_id, theme_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [A, THEME]
    )
    await pool.query(
      `INSERT INTO anime_demographic (anime_id, demographic_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [A, DEMO]
    )
    await pool.query(
      `INSERT INTO anime_character (anime_id, character_id, role) VALUES ($1,$2,'Main') ON CONFLICT DO NOTHING`,
      [A, CHAR]
    )
    await pool.query(
      `INSERT INTO anime_staff (anime_id, staff_id, role) VALUES ($1,$2,'Director,Producer') ON CONFLICT DO NOTHING`,
      [A, STAFF]
    )
    await pool.query(
      `INSERT INTO character_voice_actor (character_id, staff_id, language) VALUES ($1,$2,'Japanese') ON CONFLICT DO NOTHING`,
      [CHAR, STAFF]
    )
    await pool.query(
      `INSERT INTO anime_title_synonym (anime_id, title) VALUES ($1,'E2E Synonym') ON CONFLICT DO NOTHING`,
      [A]
    )
    await pool.query(
      `INSERT INTO anime_external_ids (anime_id, anime_themes_slug, kitsu_id, tvdb_id, created_at, updated_at)
       VALUES ($1,'e2e-slug',111,222, now(), now()) ON CONFLICT (anime_id) DO NOTHING`,
      [A]
    )
    await pool.query(
      `INSERT INTO anime_relation (anime_id, relation_type, related_anime_id)
       VALUES ($1,'Sequel',$2) ON CONFLICT DO NOTHING`,
      [A, B]
    )

    const mod = await Promise.all([
      import('@anime/repositories/anime'),
      import('@anime/repositories/anime-taxonomy'),
      import('@anime/repositories/anime-relations'),
      import('@anime/repositories/anime-title'),
      import('@anime/repositories/anime-external'),
      import('@anime/repositories/anime-characters'),
      import('@anime/repositories/character'),
      import('@anime/repositories/character-staff'),
      import('@anime/repositories/staff'),
      import('@anime/repositories/anime-staff'),
    ])
    repos = {
      anime: mod[0].animeRepository,
      taxonomy: mod[1].animeTaxonomyRepository,
      relations: mod[2].animeRelationsRepository,
      title: mod[3].animeTitleRepository,
      external: mod[4].animeExternalRepository,
      characters: mod[5].animeCharacterRepository,
      character: mod[6].characterRepository,
      characterStaff: mod[7].characterStaffRepository,
      staff: mod[8].staffRepository,
      animeStaff: mod[9].animeStaffRepository,
    }
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM anime_relation WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_external_ids WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_title_synonym WHERE anime_id = $1', [A])
    await pool.query(
      'DELETE FROM character_voice_actor WHERE character_id = $1',
      [CHAR]
    )
    await pool.query('DELETE FROM anime_staff WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_character WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_demographic WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_theme WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM anime_genre WHERE anime_id = $1', [A])
    await pool.query('DELETE FROM staff WHERE mal_id = $1', [STAFF])
    await pool.query('DELETE FROM character WHERE mal_id = $1', [CHAR])
    await pool.query('DELETE FROM demographic WHERE mal_id = $1', [DEMO])
    await pool.query('DELETE FROM theme WHERE mal_id = $1', [THEME])
    await pool.query('DELETE FROM genre WHERE mal_id = $1', [GENRE])
    await pool.query('DELETE FROM anime WHERE mal_id = ANY($1)', [[A, B]])
    await pool.end()
  })

  it('reads a single anime and many by ids', async () => {
    const one = await repos.anime.getAnimeByMalId(A)
    expect(one?.title).toBe('E2E Alpha')
    const many = await repos.anime.getManyAnimeByMalIds([A, B])
    expect(many.map((r) => r.malId).sort()).toEqual([A, B])
  })

  it('resolves taxonomy joins', async () => {
    expect(await repos.taxonomy.getGenresByAnimeId(A)).toEqual([
      { malId: GENRE, name: 'E2E Genre' },
    ])
    expect(await repos.taxonomy.getThemesByAnimeId(A)).toEqual([
      { malId: THEME, name: 'E2E Theme' },
    ])
    expect(await repos.taxonomy.getDemographicsByAnimeId(A)).toEqual([
      { malId: DEMO, name: 'E2E Demo' },
    ])
  })

  it('resolves relations and related anime data', async () => {
    const rels = await repos.relations.getRelatedAnimeByAnimeId(A)
    expect(rels).toEqual([
      { relatedAnimeId: B, relationType: 'Sequel', animeId: A },
    ])
    const data = await repos.relations.getAnimeRelatedAnimeDataByAnimeId(A)
    expect(data.map((d) => d.malId)).toEqual([B])
  })

  it('reads title synonyms and external ids', async () => {
    const syn = await repos.title.getTitleSynonymsByAnimeId(A)
    expect(syn.map((s) => s.title)).toContain('E2E Synonym')
    const ext = await repos.external.getExternalLinksByAnimeId(A)
    expect(ext).toMatchObject({
      kitsuId: 111,
      tvdbId: 222,
      animeThemesSlug: 'e2e-slug',
    })
  })

  it('resolves character refs, voices, and staff', async () => {
    const refs = await repos.characters.getCharacterRefsByAnimeId(A)
    expect(refs.map((r) => r.characterId)).toContain(CHAR)

    expect((await repos.character.getByMalId(CHAR))?.name).toBe('E2E Character')
    expect(await repos.character.getManyByMalIds([CHAR])).toHaveLength(1)

    const voices = await repos.characterStaff.getVoicesByCharacterIds([CHAR])
    expect(voices.map((v) => v.staffId)).toContain(STAFF)

    expect(await repos.staff.getManyByMalIds([STAFF])).toHaveLength(1)

    const animeStaff = await repos.animeStaff.getAnimeStaffByAnimeMalId(A)
    expect(animeStaff).toEqual([
      expect.objectContaining({ staffId: STAFF, role: 'Director,Producer' }),
    ])
  })
})
