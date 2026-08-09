/**
 * Application service for anime detail page data.
 *
 * @module domains/anime/services/anime/service
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { animeDetailsCache } from '@anime/cache/anime'
import { animeNotFound } from '@anime/errors'
import { mapAnimeDetails } from '@anime/mappers/anime'
import { animeRepository } from '@anime/repositories/anime'
import { animeTaxonomyRepository } from '@anime/repositories/anime-taxonomy'
import { getAnimeMedia } from '@media/services/get-anime-media'
import type { AnimeDetails } from '@anime/types'

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
   * @returns `{ value, isStale }` — {@link AnimeDetails} payload plus a stale flag
   * when served from last-known-good data after an infra failure
   *
   * @throws {AnimeNotFoundError} When `anime` row does not exist
   * @throws {InfraError} When any repository fails and no stale value exists
   *
   * @example
   * ```typescript
   * const { value: details, isStale } = await animeService.getAnimeDetails(5114)
   * // { malId, title, genres, imageUrl, slug, watchUrl, ... }
   * ```
   */
  async getAnimeDetails(malId: number): Promise<StaleResult<AnimeDetails>> {
    return withStaleCache({
      key: animeDetailsCache.key(malId),
      staleKey: `${animeDetailsCache.key(malId)}:stale`,
      getCache: () => animeDetailsCache.get(malId),
      getStaleCache: (key) => cacheGet<AnimeDetails>(key),
      setCache: (_, value) => animeDetailsCache.set(malId, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const anime = await animeRepository.getAnimeByMalId(malId)
        if (!anime) {
          throw animeNotFound(malId)
        }

        const [media, genres, themes, demographics] = await Promise.all([
          getAnimeMedia(malId),
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
