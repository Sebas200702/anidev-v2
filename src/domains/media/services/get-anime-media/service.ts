/**
 * @module domains/media/services/get-anime-media/service
 * @remarks Public read exposing an anime's media assets so other domains consume the media
 * domain through its service surface instead of importing {@link animeMediaRepository} directly.
 */
import { animeMediaRepository } from '@media/repositories/anime-media'
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

/**
 * Loads media assets for several anime in one query, grouped by anime id.
 *
 * @param animeIds - Internal anime identifiers
 * @returns Record keyed by anime id with clean {@link MediaAsset} rows
 * @throws {DbError} When the underlying repository query fails
 * @see {@link animeCarouselService} for the batched fan-out consumer
 * @example
 * ```typescript
 * const byAnime = await getAnimeMediaByIds([5114, 9253])
 * // byAnime[5114] is MediaAsset[]
 * ```
 */
export const getAnimeMediaByIds = async (
  animeIds: number[]
): Promise<Record<number, MediaAsset[]>> => {
  if (animeIds.length === 0) return {}
  const rows = await animeMediaRepository.getMediaByAnimeIds(animeIds)
  const grouped: Record<number, MediaAsset[]> = {}
  for (const { animeId, ...asset } of rows) {
    ;(grouped[animeId] ??= []).push(asset)
  }
  return grouped
}
