/**
 * @module domains/music/repositories/anime-music/repository
 * @remarks Database access for anime-to-music relations via the `animeMusic` join table.
 */
import { db } from '@db/client'
import { animeMusic } from '@db/schemas/anime-relations'
import { music } from '@db/schemas/music'
import type { AnimeThemeDB } from '@music/types/music-db-types'
import { asc, eq, sql } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'

/**
 * Reads music linked to anime records.
 *
 * @remarks Returns an {@link AnimeThemeDB} projection (`id`, `title`, `type`,
 * `sequence`, `episodes`) suitable for anime detail pages listing openings and
 * endings, **ordered by the theme number** (`sequence NULLS LAST`) so OP1
 * precedes OP2 instead of depending on insertion order.
 * @see {@link animeService} for anime detail orchestration that may consume these rows
 * @example
 * ```typescript
 * const tracks = await animeMusicRepository.findMusicByAnimeId(5114)
 * ```
 */
export const animeMusicRepository = {
  /**
   * Loads music entries associated with an anime.
   *
   * @param animeId - Internal anime identifier (MAL ID in this schema)
   * @returns Partial {@link MusicDB} rows linked to the anime
   * @throws {InfraError} On database failure (`[MUSIC_BY_ANIME_ID]`)
   * @see {@link musicRepository.getMusicById} for full music row lookup
   * @example
   * ```typescript
   * const musicList = await animeMusicRepository.findMusicByAnimeId(5114)
   * const openings = musicList.filter((m) => m.type === 'OP')
   * ```
   */
  async findMusicByAnimeId(animeId: number): Promise<AnimeThemeDB[]> {
    try {
      const rows = await db
        .select({
          id: music.id,
          title: music.title,
          type: music.type,
          sequence: animeMusic.sequence,
          episodes: animeMusic.episodes,
        })
        .from(animeMusic)
        .innerJoin(music, eq(animeMusic.musicId, music.id))
        .where(eq(animeMusic.animeId, animeId))
        // `sequence NULLS LAST`: los temas sin número (p. ej. un AnimeThemes que
        // MAL no lista) van al final en vez de mezclarse.
        .orderBy(sql`${animeMusic.sequence} ASC NULLS LAST`, asc(music.id))

      return rows
    } catch (error) {
      throw dbError('[MUSIC_BY_ANIME_ID]', { animeId }, error)
    }
  },
}
