/**
 * @module @domains/music/repositories/anime-music-repository
 * @remarks Database access for anime-to-music relations via the `animeMusic` join table.
 */
import { db } from '@db/client'
import { animeMusic } from '@db/schemas/anime-relations'
import { music } from '@db/schemas/music'
import type { MusicDB } from '@domains/music/types/music-db-types'
import { eq } from 'drizzle-orm'

/**
 * Reads music linked to anime records.
 *
 * @remarks Returns a partial {@link MusicDB} projection (`id`, `title`, `type`) suitable
 * for anime detail pages listing openings and endings.
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
   * @throws May propagate underlying database driver errors
   * @see {@link musicRepository.getMusicById} for full music row lookup
   * @example
   * ```typescript
   * const musicList = await animeMusicRepository.findMusicByAnimeId(5114)
   * const openings = musicList.filter((m) => m.type === 'OP')
   * ```
   */
  async findMusicByAnimeId(animeId: number): Promise<MusicDB[]> {
    const rows = await db
      .select({
        id: music.id,
        title: music.title,
        type: music.type,
      })
      .from(animeMusic)
      .innerJoin(music, eq(animeMusic.musicId, music.id))
      .where(eq(animeMusic.animeId, animeId))

    return rows
  },
}
