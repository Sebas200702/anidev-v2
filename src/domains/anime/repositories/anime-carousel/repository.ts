/**
 * Drizzle repository for featured-anime carousel rows.
 *
 * @module domains/anime/repositories/anime-carousel/repository
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { animeMedia } from '@db/schemas/anime-media'
import type { AnimeDB } from '@anime/types'
import { dbError } from '@shared/errors/db-errors'
import { asc, inArray } from 'drizzle-orm'
import { CAROUSEL_REQUIRED_MEDIA_TYPES } from '@anime/constants'

/**
 * Reads the anime eligible for the home carousel.
 *
 * @remarks
 * A slide needs **both** a banner and a clear logo, so eligibility is decided
 * from `anime_media` first and the result ordered by popularity.
 *
 * @see {@link animeCarouselService}
 */
export const animeCarouselRepository = {
  /**
   * Returns the most popular anime that have every required media asset.
   *
   * @param limit - Maximum number of rows
   * @returns Anime rows ordered by ascending popularity rank (best first)
   *
   * @throws {InfraError} On query failure (`DB_ERROR`)
   *
   * @example
   * ```typescript
   * const rows = await animeCarouselRepository.getTopPopularWithMedia(6)
   * ```
   */
  async getTopPopularWithMedia(limit: number): Promise<AnimeDB[]> {
    try {
      const mediaRows = await db
        .select({
          animeId: animeMedia.animeId,
          mediaType: animeMedia.mediaType,
        })
        .from(animeMedia)
        .where(
          inArray(animeMedia.mediaType, [...CAROUSEL_REQUIRED_MEDIA_TYPES])
        )

      const idsByType = new Map<string, Set<number>>(
        CAROUSEL_REQUIRED_MEDIA_TYPES.map((type) => [type, new Set<number>()])
      )
      for (const row of mediaRows) {
        idsByType.get(row.mediaType)?.add(row.animeId)
      }

      const [firstType, ...restTypes] = CAROUSEL_REQUIRED_MEDIA_TYPES
      const validIds = [...(idsByType.get(firstType) ?? [])].filter((id) =>
        restTypes.every((type) => idsByType.get(type)?.has(id))
      )

      if (validIds.length === 0) return []

      return await db
        .select()
        .from(anime)
        .where(inArray(anime.malId, validIds))
        .orderBy(asc(anime.popularityRank))
        .limit(limit)
    } catch (error) {
      throw dbError('[GET_TOP_POPULAR_WITH_MEDIA]', { limit }, error)
    }
  },
}
