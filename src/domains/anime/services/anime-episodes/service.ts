/**
 * Application service for the anime episode catalog.
 *
 * @module domains/anime/services/anime-episodes/service
 */
import { episodeNotFound } from '@anime/errors'
import {
  type AnimeEpisodesPage,
  animeEpisodesCache,
} from '@anime/cache/anime-episodes'
import {
  mapAnimeEpisodeDetail,
  mapAnimeEpisodeItems,
} from '@anime/mappers/anime-episode'
import {
  type EpisodesPageInput,
  animeEpisodesRepository,
} from '@anime/repositories/anime-episodes'
import type { AnimeEpisodeDetail } from '@anime/types'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { CacheTtl } from '@lib/cache/config'
import { assertAnimeExists } from './helpers'

const setStale = <T>(key: string, value: T) =>
  cacheSet(key, value, { ttlSeconds: CacheTtl.Stale })

/**
 * Coordinates repository access, mapping and caching for episode reads.
 *
 * @remarks
 * **Pipeline:** cache → repository (page + count in parallel) → mapper → cache.
 * Not-found outcomes are domain errors: never cached, never stale-served.
 *
 * @see {@link animeEpisodesCache}
 */
export const animeEpisodesService = {
  /**
   * Loads one page of an anime's episodes plus the total count.
   *
   * @param input - `{ malId, page, limit }`
   * @returns `{ value: { list, total }, isStale }`
   *
   * @throws {AnimeNotFoundError} When the total is zero and the anime is missing
   * @throws {InfraError} On database/cache failure with no stale copy
   *
   * @example
   * ```typescript
   * const { value } = await animeEpisodesService.getEpisodes({ malId: 1, page: 1, limit: 24 })
   * // value.list[0] → { id, number: 1, title: 'Asteroid Blues', duration, aired }
   * ```
   */
  async getEpisodes(
    input: EpisodesPageInput
  ): Promise<StaleResult<AnimeEpisodesPage>> {
    const { malId, page, limit } = input
    const key = animeEpisodesCache.pageKey(malId, page, limit)
    return withStaleCache({
      key,
      staleKey: `${key}:stale`,
      getCache: () => animeEpisodesCache.getPage(malId, page, limit),
      getStaleCache: (staleKey) => cacheGet<AnimeEpisodesPage>(staleKey),
      setCache: (_, value) =>
        animeEpisodesCache.setPage(malId, page, limit, value),
      setStaleCache: setStale,
      compute: async () => {
        const [rows, total] = await Promise.all([
          animeEpisodesRepository.getEpisodesPage(input),
          animeEpisodesRepository.countEpisodes(malId),
        ])
        if (total === 0) await assertAnimeExists(malId)
        return { list: mapAnimeEpisodeItems(rows), total }
      },
    })
  },

  /**
   * Loads one episode by number, with its synopsis.
   *
   * @param malId - Parent anime MAL ID
   * @param number - Episode number
   * @returns `{ value: AnimeEpisodeDetail, isStale }`
   *
   * @throws {AnimeNotFoundError} When the anime is missing
   * @throws {EpisodeNotFoundError} When the anime exists but the episode does not
   * @throws {InfraError} On database/cache failure with no stale copy
   */
  async getEpisode(
    malId: number,
    number: number
  ): Promise<StaleResult<AnimeEpisodeDetail>> {
    const key = animeEpisodesCache.episodeKey(malId, number)
    return withStaleCache({
      key,
      staleKey: `${key}:stale`,
      getCache: () => animeEpisodesCache.getEpisode(malId, number),
      getStaleCache: (staleKey) => cacheGet<AnimeEpisodeDetail>(staleKey),
      setCache: (_, value) =>
        animeEpisodesCache.setEpisode(malId, number, value),
      setStaleCache: setStale,
      compute: async () => {
        const row = await animeEpisodesRepository.getEpisodeByNumber(
          malId,
          number
        )
        if (row) return mapAnimeEpisodeDetail(row)
        await assertAnimeExists(malId)
        throw episodeNotFound(malId, number)
      },
    })
  },
}
