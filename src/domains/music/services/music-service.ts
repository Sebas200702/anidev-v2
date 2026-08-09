/**
 * @module @music/services/music-service
 * @remarks Application service for music detail reads. Coordinates parallel repository
 * queries, resolution batching, mapping, and read-through caching.
 */
import type { MusicDetails } from '@music/types/music-details-types'
import { musicCache } from '@music/cache/music-cache'
import { musicNotFound } from '@music/errors'
import { mapMusicDetail } from '@music/mappers/music-detail-mapper'
import { musicRelationRepository } from '@music/repositories/music-relation-repository'
import { musicRepository } from '@music/repositories/music-repository'
import { musicVersionRepository } from '@music/repositories/music-version-repository'
import type {
  MusicResolutionDB,
  MusicVersionDB,
} from '@music/types/music-db-types'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'

/**
 * Coordinates repository access, mapping, and caching for music details.
 *
 * @remarks Uses {@link withStaleCache} with {@link musicCache} keys so repeated detail
 * requests avoid redundant database round-trips and resolution fan-out queries. On
 * infra failure serves last-known-good cached data tagged stale.
 * @see {@link mapMusicDetail} for payload assembly
 * @see {@link musicCache} for cache key and TTL configuration
 * @example
 * ```typescript
 * import { musicService } from '@music/services/music-service'
 *
 * const { value: details, isStale } = await musicService.getMusicDetailsById(42)
 * console.log(details.title, details.versions.length)
 * ```
 */
export const musicService = {
  /**
   * Loads music details by internal ID, using cache when available.
   *
   * @remarks On cache miss, loads the core music row, all versions, artist relations, and
   * resolutions for each version in parallel. Missing music rows raise
   * {@link MusicNotFoundError}.
   * @param id - Internal music identifier
   * @returns `{ value, isStale }` — cached or freshly loaded {@link MusicDetails}
   * payload plus a stale flag
   * @throws {MusicNotFoundError} When no music record exists for the ID
   * @throws {InfraError} When the database fails and no stale value exists
   * @see {@link musicCache.key} for the cache key used by {@link withStaleCache}
   * @example
   * ```typescript
   * try {
   *   const { value: details } = await musicService.getMusicDetailsById(42)
   *   console.log(details.artist[0]?.name)
   * } catch (error) {
   *   if (error instanceof MusicNotFoundError) {
   *     // handle 404
   *   }
   * }
   * ```
   */
  async getMusicDetailsById(id: number): Promise<StaleResult<MusicDetails>> {
    return withStaleCache({
      key: musicCache.key(id),
      staleKey: `${musicCache.key(id)}:stale`,
      getCache: () => musicCache.get(id),
      getStaleCache: (key) => cacheGet<MusicDetails>(key),
      setCache: (_, value) => musicCache.set(id, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const [music, versions, relations] = await Promise.all([
          musicRepository.getMusicById(id),
          musicVersionRepository.findVersionsByMusicId(id),
          musicRelationRepository.findArtistsByMusicId(id),
        ])

        if (!music) {
          throw musicNotFound(id)
        }

        let resolutionsByVersionId: Record<number, MusicResolutionDB[]> = {}

        if (versions.length > 0) {
          const resolutionLists = await Promise.all(
            versions.map((v: MusicVersionDB) =>
              musicVersionRepository.findResolutionsByVersionId(v.versionId)
            )
          )

          resolutionsByVersionId = versions.reduce<
            Record<number, MusicResolutionDB[]>
          >(
            (
              acc: Record<number, MusicResolutionDB[]>,
              v: MusicVersionDB,
              index: number
            ): Record<number, MusicResolutionDB[]> => {
              acc[v.versionId] = resolutionLists[index]
              return acc
            },
            {}
          )
        }

        const details = mapMusicDetail({
          music,
          artists: relations,
          versions,
          resolutionsByVersionId,
        })

        return details
      },
    })
  },
}
