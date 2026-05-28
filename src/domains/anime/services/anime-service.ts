/**
 * Application service for anime detail page data.
 *
 * @module domains/anime/services/anime-service
 */
import { withCache } from '@lib/cache'
import { animeDetailsCache } from '@domains/anime/cache/anime-cache'
import { animeNotFound } from '@domains/anime/errors'
import { mapAnimeDetails } from '@domains/anime/mappers/anime-mapper'
import { animeRepository } from '@domains/anime/repositories/anime-repository'
import { animeTaxonomyRepository } from '@domains/anime/repositories/anime-taxonomy-repository'
import { animeMediaRepository } from '@domains/media/repositories/anime-media-repository'

/**
 * Coordinates repository access, mapping, and caching for anime details.
 *
 * @remarks
 * **Pipeline:** `animeDetailsCache.key(malId)` → `get` → on miss:
 * `animeRepository` → taxonomy + media repos → `mapAnimeDetails` → `set`
 *
 * **Cache TTL:** {@link CacheTtl.Medium} (3600 s) via {@link animeDetailsCache}
 *
 * **Domain errors:** {@link AnimeNotFoundError} when core anime row is missing
 *
 * @see {@link animeDetailsCache}
 * @see {@link mapAnimeDetails}
 */
export const animeService = {
  /**
   * Loads anime details for a MAL ID, using cache when available.
   *
   * @param malId - MyAnimeList identifier
   * @returns {@link AnimeDetails} — poster URLs, taxonomy strings, trailer, slug, share links
   *
   * @throws {AnimeNotFoundError} When `anime` row does not exist
   * @throws {InfraError} When any repository or cache layer fails
   *
   * @example
   * ```typescript
   * const details = await animeService.getAnimeDetails(5114)
   * // { malId, title, genres, imageUrl, slug, watchUrl, ... }
   * ```
   */
  async getAnimeDetails(malId: number) {
    return withCache({
      key: animeDetailsCache.key(malId),
      getCache: () => animeDetailsCache.get(malId),
      setCache: (_, value) => animeDetailsCache.set(malId, value),
      compute: async () => {
        const anime = await animeRepository.getAnimeByMalId(malId)
        if (!anime) {
          throw animeNotFound(malId)
        }

        const [media, genres, themes, demographics] = await Promise.all([
          animeMediaRepository.getMediaByAnimeId(malId),
          animeTaxonomyRepository.getGenresByAnimeId(malId),
          animeTaxonomyRepository.getThemesByAnimeId(malId),
          animeTaxonomyRepository.getDemographicsByAnimeId(malId),
        ])

        return mapAnimeDetails({
          anime,
          media,
          genres,
          themes,
          demographics,
        })
      },
    })
  },
}
