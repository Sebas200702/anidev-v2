/**
 * Catalog checks behind profile gallery picks.
 *
 * @module domains/user/repositories/profile-gallery/repository
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { animeMedia } from '@db/schemas/anime-media'
import { ADULT_RATINGS } from '@anime/constants'
import { PROFILE_BANNER_MEDIA_TYPE } from '@user/constants'
import { dbError } from '@shared/errors/db-errors'
import { and, eq, isNull, notInArray, or } from 'drizzle-orm'

const safeAnime = or(
  isNull(anime.rating),
  notInArray(anime.rating, [...ADULT_RATINGS])
)

/** Repository of the catalog lookups used to validate gallery picks. */
export const profileGalleryRepository = {
  /**
   * Whether the anime exists, is not adult-rated and has banner media.
   *
   * @param animeId - MyAnimeList anime id
   * @returns `true` when its banner can be used as a profile banner
   * @throws {InfraError} On database failure
   */
  async hasSafeAnimeBanner(animeId: number): Promise<boolean> {
    try {
      const rows = await db
        .select({ id: animeMedia.id })
        .from(anime)
        .innerJoin(animeMedia, eq(animeMedia.animeId, anime.malId))
        .where(
          and(
            eq(anime.malId, animeId),
            eq(animeMedia.mediaType, PROFILE_BANNER_MEDIA_TYPE),
            safeAnime
          )
        )
        .limit(1)
      return rows.length > 0
    } catch (error) {
      throw dbError('[HAS_SAFE_ANIME_BANNER]', { animeId }, error)
    }
  },
}
