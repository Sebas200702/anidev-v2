/**
 * Application service for full anime detail payloads.
 *
 * @module domains/anime/services/anime-full/service
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { animeFullCache } from '@anime/cache/anime-full'
import { animeNotFound } from '@anime/errors'
import { mapAnimeToFullDetails } from '@anime/mappers/anime-full'
import { animeRepository } from '@anime/repositories/anime'
import { animeExternalRepository } from '@anime/repositories/anime-external'
import { animeRelationsRepository } from '@anime/repositories/anime-relations'
import { animeTaxonomyRepository } from '@anime/repositories/anime-taxonomy'
import { animeTitleRepository } from '@anime/repositories/anime-title'
import { getAnimeMedia } from '@media/services/get-anime-media'
import { getMusicByAnimeId } from '@music/services/anime-music'
import type { AnimeFullDetails } from '@anime/types'

/**
 * Coordinates repository access, mapping, and caching for full anime details.
 *
 * @remarks
 * **Pipeline:** `anime:full:{malId}` → core anime → parallel fetch of media,
 * taxonomy, synonyms, relations, external IDs, music → `mapAnimeToFullDetails`
 *
 * **Cache TTL:** {@link CacheTtl.Medium} (3600 s)
 *
 * @throws {AnimeNotFoundError} Missing core anime row
 *
 * @see {@link animeFullCache}
 * @see {@link mapAnimeToFullDetails}
 */
export const animeFullService = {
  /**
   * Loads the expanded anime detail payload for a MAL ID.
   *
   * @param malId - MyAnimeList identifier
   * @returns `{ value, isStale }` — {@link AnimeFullDetails} payload plus a stale flag
   *
   * @throws {AnimeNotFoundError}
   * @throws {InfraError} When the database fails and no stale value exists
   *
   * @example
   * ```typescript
   * const { value: full, isStale } =
   *   await animeFullService.getAnimeFullByMalId(5114)
   * ```
   */
  async getAnimeFullByMalId(
    malId: number
  ): Promise<StaleResult<AnimeFullDetails>> {
    let musicIsStale = false
    const result = await withStaleCache({
      key: animeFullCache.key(malId),
      staleKey: `${animeFullCache.key(malId)}:stale`,
      getCache: () => animeFullCache.get(malId),
      getStaleCache: (key) => cacheGet<AnimeFullDetails>(key),
      setCache: (_, value) => animeFullCache.set(malId, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const anime = await animeRepository.getAnimeByMalId(malId)
        if (!anime) {
          throw animeNotFound(malId)
        }

        const [
          media,
          genres,
          themes,
          demographics,
          titleSynonyms,
          relations,
          relationData,
          externalIds,
          animeMusic,
        ] = await Promise.all([
          getAnimeMedia(malId),
          animeTaxonomyRepository.getGenresByAnimeId(malId),
          animeTaxonomyRepository.getThemesByAnimeId(malId),
          animeTaxonomyRepository.getDemographicsByAnimeId(malId),
          animeTitleRepository.getTitleSynonymsByAnimeId(malId),
          animeRelationsRepository.getRelatedAnimeByAnimeId(malId),
          animeRelationsRepository.getAnimeRelatedAnimeDataByAnimeId(malId),
          animeExternalRepository.getExternalLinksByAnimeId(malId),
          getMusicByAnimeId(malId),
        ])

        musicIsStale = animeMusic.isStale

        return mapAnimeToFullDetails({
          anime,
          genres,
          themes,
          demographics,
          media,
          titleSynonyms,
          relations,
          relationData,
          externalIds,
          animeMusic: animeMusic.value,
        })
      },
    })

    return { value: result.value, isStale: result.isStale || musicIsStale }
  },
}
