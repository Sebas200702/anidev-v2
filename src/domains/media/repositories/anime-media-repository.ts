/**
 * @module @domains/media/repositories/anime-media-repository
 * @remarks Database access for anime media assets stored in the `animeMedia` table.
 */
import { db } from '@db/client'
import { animeMedia } from '@db/schemas/anime-media'
import { dbError } from '@shared/errors/db-errors'
import type { MediaAsset } from '@domains/media/types/media-types'
import { and, asc, eq, inArray } from 'drizzle-orm'

/** Parameters for filtering anime media by entity ID and media type. */
type GetAnimeMediaByTypeParams = {
  mediaType: string
  animeId: number
}

/**
 * Reads media assets linked to anime records.
 *
 * @remarks All queries return {@link MediaAsset} rows consumed by {@link resolveMediaAssets}
 * during semantic path resolution. Failures are wrapped in {@link dbError}.
 * @see {@link animeService} for anime detail pages that load all media for an anime
 * @example
 * ```typescript
 * const posters = await animeMediaRepository.getMediaByEntityAndType({
 *   animeId: 5114,
 *   mediaType: 'poster',
 * })
 * ```
 */
export const animeMediaRepository = {
  /**
   * Loads all media assets for an anime.
   *
   * @param animeId - Internal anime identifier (MAL ID in this schema)
   * @returns All {@link MediaAsset} rows for the anime
   * @throws {DbError} When the database query fails
   * @see {@link animeMediaRepository.getMediaByEntityAndType} for type-filtered lookup
   * @example
   * ```typescript
   * const media = await animeMediaRepository.getMediaByAnimeId(5114)
   * ```
   */
  async getMediaByAnimeId(animeId: number): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(eq(animeMedia.animeId, animeId))
        .orderBy(asc(animeMedia.id))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_ID]', { animeId }, error)
    }
  },

  /**
   * Loads media assets for multiple anime IDs.
   *
   * @param animeIds - Internal anime identifiers
   * @returns {@link MediaAsset} rows for the requested anime
   * @throws {DbError} When the database query fails
   * @see {@link animeMediaRepository.getMediaByAnimeId} for single-anime lookup
   * @example
   * ```typescript
   * const media = await animeMediaRepository.getMediaByAnimeIds([5114, 9253])
   * ```
   */
  async getMediaByAnimeIds(animeIds: number[]): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(inArray(animeMedia.animeId, animeIds))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_IDS]', { animeIds }, error)
    }
  },

  /**
   * Loads media assets for an anime filtered by media type.
   *
   * @remarks Results are ordered ascending by `id` so {@link mapIndexedMediaAsset} selects
   * assets deterministically by 1-based index.
   * @param params - Anime ID and media type filter
   * @returns Matching {@link MediaAsset} rows ordered by ID
   * @throws {DbError} When the database query fails
   * @see {@link mediaService.resolveMedia} for size/source filtering after load
   * @example
   * ```typescript
   * const banners = await animeMediaRepository.getMediaByEntityAndType({
   *   animeId: 5114,
   *   mediaType: 'banner',
   * })
   * ```
   */
  async getMediaByEntityAndType({
    mediaType,
    animeId,
  }: GetAnimeMediaByTypeParams): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .orderBy(asc(animeMedia.id))
        .where(
          and(
            eq(animeMedia.animeId, animeId),
            eq(animeMedia.mediaType, mediaType)
          )
        )
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_ANIME_ID_AND_TYPE]',
        { mediaType, animeId },
        error
      )
    }
  },
}
