/**
 * Integration tests for the media domain repositories against a real Postgres.
 *
 * @module domains/media/__tests__/repositories/media-repositories.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Self-seeding in a reserved id range (`999_003_xxx`); fixtures are removed
 * in `afterAll`. Validates the real SQL — entity/type filtering, the music version→resolution join,
 * and the episode-source projection — that the unit tests mock.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run media-repositories.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const ANIME = 999_003_101
const CHAR = 999_003_301
const STAFF = 999_003_401
const MUSIC = 999_003_501
const VERSION_ID = 999_003_601
const EPISODE = 999_003_801

describe.skipIf(!enabled)('media repositories (integration)', () => {
  let pool: PgPool
  let repos: {
    anime: typeof import('@media/repositories/anime-media')['animeMediaRepository']
    character: typeof import('@media/repositories/character-media')['characterMediaRepository']
    episode: typeof import('@media/repositories/episode-media')['episodeMediaRepository']
    music: typeof import('@media/repositories/music-media')['musicMediaRepository']
    staff: typeof import('@media/repositories/staff-media')['staffMediaRepository']
  }

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'E2E Media Anime','TV') ON CONFLICT (mal_id) DO NOTHING`,
      [ANIME]
    )
    await pool.query(
      `INSERT INTO character (mal_id, name) VALUES ($1,'E2E Media Char') ON CONFLICT (mal_id) DO NOTHING`,
      [CHAR]
    )
    await pool.query(
      `INSERT INTO staff (mal_id, name) VALUES ($1,'E2E Media Staff') ON CONFLICT (mal_id) DO NOTHING`,
      [STAFF]
    )
    await pool.query(
      `INSERT INTO music (id, title, type) VALUES ($1,'E2E Media Music','OP') ON CONFLICT (id) DO NOTHING`,
      [MUSIC]
    )

    await pool.query(
      `INSERT INTO anime_media (anime_id, media_type, src, size) VALUES ($1,'poster','http://cdn/a.jpg','large') ON CONFLICT DO NOTHING`,
      [ANIME]
    )
    await pool.query(
      `INSERT INTO character_media (character_id, media_type, src, size) VALUES ($1,'poster','http://cdn/c.jpg','small') ON CONFLICT DO NOTHING`,
      [CHAR]
    )
    await pool.query(
      `INSERT INTO staff_media (staff_id, media_type, src, size) VALUES ($1,'poster','http://cdn/s.jpg','large') ON CONFLICT DO NOTHING`,
      [STAFF]
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
      `INSERT INTO episode (id, anime_id, title, number) VALUES ($1,$2,'E2E Episode',1) ON CONFLICT (id) DO NOTHING`,
      [EPISODE, ANIME]
    )
    await pool.query(
      `INSERT INTO episode_source (episode_id, src) VALUES ($1,'http://cdn/ep.mp4') ON CONFLICT DO NOTHING`,
      [EPISODE]
    )

    const mod = await Promise.all([
      import('@media/repositories/anime-media'),
      import('@media/repositories/character-media'),
      import('@media/repositories/episode-media'),
      import('@media/repositories/music-media'),
      import('@media/repositories/staff-media'),
    ])
    repos = {
      anime: mod[0].animeMediaRepository,
      character: mod[1].characterMediaRepository,
      episode: mod[2].episodeMediaRepository,
      music: mod[3].musicMediaRepository,
      staff: mod[4].staffMediaRepository,
    }
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query('DELETE FROM episode_source WHERE episode_id = $1', [
      EPISODE,
    ])
    await pool.query('DELETE FROM episode WHERE id = $1', [EPISODE])
    await pool.query(
      'DELETE FROM music_resolution WHERE music_version_id = $1',
      [VERSION_ID]
    )
    await pool.query('DELETE FROM music_version WHERE music_id = $1', [MUSIC])
    await pool.query('DELETE FROM anime_media WHERE anime_id = $1', [ANIME])
    await pool.query('DELETE FROM character_media WHERE character_id = $1', [
      CHAR,
    ])
    await pool.query('DELETE FROM staff_media WHERE staff_id = $1', [STAFF])
    await pool.query('DELETE FROM music WHERE id = $1', [MUSIC])
    await pool.query('DELETE FROM staff WHERE mal_id = $1', [STAFF])
    await pool.query('DELETE FROM character WHERE mal_id = $1', [CHAR])
    await pool.query('DELETE FROM anime WHERE mal_id = $1', [ANIME])
    await pool.end()
  })

  it('reads anime media by id and by entity+type', async () => {
    expect(
      (await repos.anime.getMediaByAnimeId(ANIME)).length
    ).toBeGreaterThanOrEqual(1)
    expect(await repos.anime.getMediaByAnimeIds([ANIME])).toHaveLength(1)
    const typed = await repos.anime.getMediaByEntityAndType({
      mediaType: 'poster',
      animeId: ANIME,
    })
    expect(typed[0]).toMatchObject({
      mediaType: 'poster',
      src: 'http://cdn/a.jpg',
    })
  })

  it('reads character and staff media', async () => {
    expect(await repos.character.getMediaByCharacterIds([CHAR])).toHaveLength(1)
    const c = await repos.character.getMediaByEntityAndType({
      mediaType: 'poster',
      characterId: CHAR,
    })
    expect(c[0]).toMatchObject({ src: 'http://cdn/c.jpg' })
    const s = await repos.staff.getMediaByEntityAndType({
      mediaType: 'poster',
      staffId: STAFF,
    })
    expect(s[0]).toMatchObject({ src: 'http://cdn/s.jpg', size: 'large' })
  })

  it('maps music media by requested audio/video track', async () => {
    const audio = await repos.music.getMediaByEntityAndType({
      mediaType: 'audio',
      musicId: MUSIC,
    })
    expect(audio[0]).toMatchObject({ src: 'http://cdn/a.mp3', size: '1080p' })
    const video = await repos.music.getMediaByEntityAndType({
      mediaType: 'video',
      musicId: MUSIC,
    })
    expect(video[0]).toMatchObject({ src: 'http://cdn/v.mp4' })
  })

  it('maps episode sources into media assets', async () => {
    const rows = await repos.episode.getMediaByEntityAndType({
      mediaType: 'video',
      episodeId: EPISODE,
    })
    expect(rows[0]).toMatchObject({
      mediaType: 'video',
      src: 'http://cdn/ep.mp4',
      size: null,
    })
  })
})
