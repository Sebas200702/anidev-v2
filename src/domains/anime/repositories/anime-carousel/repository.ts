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
import { asc, countDistinct, eq, inArray } from 'drizzle-orm'
import { CAROUSEL_REQUIRED_MEDIA_TYPES } from '@anime/constants'

/**
 * Reads the anime eligible for the home carousel.
 *
 * @remarks
 * A slide needs **both** a banner and a clear logo, so eligibility is decided
 * set-based in a single query (`GROUP BY` + `HAVING COUNT(DISTINCT)`) over the
 * indexed `(anime_id, media_type)` columns, ordered by popularity.
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
      const eligibleIds = db
        .select({ animeId: animeMedia.animeId })
        .from(animeMedia)
        .where(
          inArray(animeMedia.mediaType, [...CAROUSEL_REQUIRED_MEDIA_TYPES])
        )
        .groupBy(animeMedia.animeId)
        .having(
          eq(
            countDistinct(animeMedia.mediaType),
            CAROUSEL_REQUIRED_MEDIA_TYPES.length
          )
        )

      return await db
        .select()
        .from(anime)
        .where(inArray(anime.malId, eligibleIds))
        .orderBy(asc(anime.popularityRank))
        .limit(limit)
    } catch (error) {
      throw dbError('[GET_TOP_POPULAR_WITH_MEDIA]', { limit }, error)
    }
  },
}
