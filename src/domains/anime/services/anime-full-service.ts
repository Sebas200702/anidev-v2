/**
 * Application service for full anime detail payloads.
 *
 * @module domains/anime/services/anime-full-service
 */
import { withCache } from '@lib/cache'
import { animeFullCache } from '@anime/cache/anime-full-cache'
import { animeNotFound } from '@anime/errors'
import { mapAnimeToFullDetails } from '@anime/mappers/anime-full-mapper'
import { animeRepository } from '@anime/repositories/anime-repository'
import { animeExternalRepository } from '@anime/repositories/anime-external-repository'
import { animeRelationsRepository } from '@anime/repositories/anime-relations-repository'
import { animeTaxonomyRepository } from '@anime/repositories/anime-taxonomy-repository'
import { animeTitleRepository } from '@anime/repositories/anime-title-repository'
import { getAnimeMedia } from '@media/services/get-anime-media-service'
import { getMusicByAnimeId } from '@music/services/anime-music-service'
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
   * @returns {@link AnimeFullDetails} — titles, relations, music, external IDs, rich taxonomy
   *
   * @throws {AnimeNotFoundError}
   * @throws {InfraError}
   *
   * @example
   * ```typescript
   * const full = await animeFullService.getAnimeFullByMalId(5114)
   * ```
   */
  async getAnimeFullByMalId(malId: number): Promise<AnimeFullDetails> {
    return withCache({
      key: animeFullCache.key(malId),
      getCache: () => animeFullCache.get(malId),
      setCache: (_, value) => animeFullCache.set(malId, value),
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
          animeMusic,
        })
      },
    })
  },
}
