/**
 * @module domains/music/services/anime-music/service
 * @remarks Public read exposing an anime's linked music so other domains consume the music
 * domain through its service surface instead of importing {@link animeMusicRepository} directly.
 */
import { animeMusicRepository } from '@music/repositories/anime-music'
import type { MusicDB } from '@music/types/music-db-types'

/**
 * Loads the music entries linked to an anime.
 *
 * @param animeId - Internal anime identifier (MAL ID in this schema)
 * @returns Partial {@link MusicDB} rows linked to the anime
 * @throws {DbError} When the underlying repository query fails
 * @see {@link animeMusicRepository.findMusicByAnimeId}
 * @example
 * ```typescript
 * const tracks = await getMusicByAnimeId(5114)
 * ```
 */
export const getMusicByAnimeId = async (animeId: number): Promise<MusicDB[]> =>
  animeMusicRepository.findMusicByAnimeId(animeId)
