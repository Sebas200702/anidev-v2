/**
 * Integration tests for the music domain repositories against a real Postgres.
 *
 * @module domains/music/__tests__/repositories/music-repositories.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Self-seeding in a reserved id range (`999_002_xxx`); fixtures are removed
 * in `afterAll`. Validates the real SQL — version/resolution joins, artist joins, and the list
 * filter builder — that the unit tests mock.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run music-repositories.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const ANIME = 999_002_101
const MUSIC = 999_002_501
const VERSION_ID = 999_002_601
const ARTIST = 999_002_701

describe.skipIf(!enabled)('music repositories (integration)', () => {
  let pool: PgPool
  let repos: {
    music: typeof import('@music/repositories/music')['musicRepository']
    list: typeof import('@music/repositories/music-list')['musicListRepository']
    relation: typeof import('@music/repositories/music-relation')['musicRelationRepository']
    version: typeof import('@music/repositories/music-version')['musicVersionRepository']
    animeMusic: typeof import('@music/repositories/anime-music')['animeMusicRepository']
  }

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'E2E Music Anime','TV') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME]
    )
    await pool.query(
      `INSERT INTO music (id, title, type) VALUES ($1,'E2E Music Song','OP') ON CONFLICT (id) DO NOTHING`,
      [MUSIC]
    )
    // artist.mal_id has an FK to staff.mal_id, so leave it NULL for a standalone fixture.
    await pool.query(
      `INSERT INTO artist (id, name, mal_id) VALUES ($1,'E2E Artist',NULL) ON CONFLICT (id) DO NOTHING`,
      [ARTIST]
    )
    await pool.query(
      `INSERT INTO music_artist (music_id, artist_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [MUSIC, ARTIST]
    )
    await pool.query(
      `INSERT INTO music_version (music_id, version, version_id) VALUES ($1,1,$2) ON CONFLICT DO NOTHING`,
      [MUSIC, VERSION_ID]
    )
    await pool.query(
      `INSERT INTO music_resolution (music_version_id, song_id, resolution, audio_url, video_url)
       VALUES ($1,1,'1080p','http://cdn/a.mp3','http://cdn/v.mp4') ON CONFLICT DO NOTHING`,
      [VERSION_ID]
    )
    await pool.query(
      `INSERT INTO anime_music (anime_id, music_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [ANIME, MUSIC]
    )

    const mod = await Promise.all([
      import('@music/repositories/music'),
      import('@music/repositories/music-list'),
      import('@music/repositories/music-relation'),
      import('@music/repositories/music-version'),
      import('@music/repositories/anime-music'),
    ])
    repos = {
      music: mod[0].musicRepository,
      list: mod[1].musicListRepository,
      relation: mod[2].musicRelationRepository,
      version: mod[3].musicVersionRepository,
      animeMusic: mod[4].animeMusicRepository,
    }
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM anime_music WHERE music_id = $1', [MUSIC])
    await pool.query(
      'DELETE FROM music_resolution WHERE music_version_id = $1',
      [VERSION_ID]
    )
    await pool.query('DELETE FROM music_version WHERE music_id = $1', [MUSIC])
    await pool.query('DELETE FROM music_artist WHERE music_id = $1', [MUSIC])
    await pool.query('DELETE FROM artist WHERE id = $1', [ARTIST])
    await pool.query('DELETE FROM music WHERE id = $1', [MUSIC])
    await pool.query('DELETE FROM anime WHERE mal_id = $1', [ANIME])
    await pool.end()
  })

  it('reads music by id, by ids, and by type', async () => {
    expect((await repos.music.getMusicById(MUSIC)).title).toBe('E2E Music Song')
    expect(await repos.music.findManyByIds([MUSIC])).toHaveLength(1)
    // findByType has no deterministic order and the DB holds real rows, so assert the
    // WHERE filter itself: every returned row is the requested type, and there is at least one.
    const byType = await repos.music.findByType('OP', 20)
    expect(byType.length).toBeGreaterThan(0)
    expect(byType.every((m) => m.type === 'OP')).toBe(true)
  })

  it('lists and counts with the title-query filter', async () => {
    const rows = await repos.list.getMusicList({
      page: 1,
      limit: 50,
      type: 'OP',
      query: 'E2E Music Song',
    })
    expect(rows.some((m) => m.id === MUSIC)).toBe(true)
    const count = await repos.list.getMusicListCount({
      type: 'OP',
      query: 'E2E Music Song',
    })
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('resolves artists by single and multiple ids', async () => {
    const one = await repos.relation.findArtistsByMusicId(MUSIC)
    expect(one).toEqual([
      expect.objectContaining({ id: ARTIST, name: 'E2E Artist' }),
    ])
    const many = await repos.relation.findArtistsByMusicIds([MUSIC])
    expect(many).toEqual([
      expect.objectContaining({ id: ARTIST, musicId: MUSIC }),
    ])
  })

  it('resolves versions and resolutions', async () => {
    const versions = await repos.version.findVersionsByMusicId(MUSIC)
    expect(versions.map((v) => v.versionId)).toContain(VERSION_ID)
    expect(
      await repos.version.findResolutionsByVersionId(VERSION_ID)
    ).toHaveLength(1)
    expect(
      await repos.version.findResolutionsByVersionIds([VERSION_ID])
    ).toHaveLength(1)
  })

  it('resolves anime themes via the join', async () => {
    const rows = await repos.animeMusic.findMusicByAnimeId(ANIME)
    expect(rows).toEqual([expect.objectContaining({ id: MUSIC, type: 'OP' })])
  })
})
