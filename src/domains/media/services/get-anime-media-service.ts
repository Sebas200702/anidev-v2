/**
 * @module @media/services/get-anime-media-service
 * @remarks Public read exposing an anime's media assets so other domains consume the media
 * domain through its service surface instead of importing {@link animeMediaRepository} directly.
 */
import { animeMediaRepository } from '@media/repositories/anime-media-repository'
import type { MediaAsset } from '@media/types/media-types'

/**
 * Loads every media asset linked to an anime.
 *
 * @param animeId - Internal anime identifier (MAL ID in this schema)
 * @returns All {@link MediaAsset} rows for the anime
 * @throws {DbError} When the underlying repository query fails
 * @see {@link animeMediaRepository.getMediaByAnimeId}
 * @example
 * ```typescript
 * const media = await getAnimeMedia(5114)
 * ```
 */
export const getAnimeMedia = async (animeId: number): Promise<MediaAsset[]> =>
  animeMediaRepository.getMediaByAnimeId(animeId)
