/**
 * @module @domains/music/services/music-service
 * @remarks Application service for music detail reads. Coordinates parallel repository
 * queries, resolution batching, mapping, and read-through caching.
 */
import { musicRepository } from '@domains/music/repositories/music-repository'
import { musicVersionRepository } from '@domains/music/repositories/music-version-repository'
import { musicRelationRepository } from '@domains/music/repositories/music-relation-repository'
import { mapMusicDetail } from '@domains/music/mappers/music-detail-mapper'
import { musicNotFound } from '@domains/music/errors'
import { musicCache } from '@domains/music/cache/music-cache'
import type {
  MusicResolutionDB,
  MusicVersionDB,
} from '@domains/music/types/music-db.d-types'
import { withCache } from '@lib/cache'
import type { MusicDetails } from '@domains/music/types/music-details.d-types'

/**
 * Coordinates repository access, mapping, and caching for music details.
 *
 * @remarks Uses {@link withCache} with {@link musicCache} keys so repeated detail requests
 * avoid redundant database round-trips and resolution fan-out queries.
 * @see {@link mapMusicDetail} for payload assembly
 * @see {@link musicCache} for cache key and TTL configuration
 * @example
 * ```typescript
 * import { musicService } from '@domains/music/services/music-service'
 *
 * const details = await musicService.getMusicDetailsById(42)
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
   * @returns Cached or freshly loaded {@link MusicDetails} payload
   * @throws {MusicNotFoundError} When no music record exists for the ID
   * @see {@link musicCache.key} for the cache key used by {@link withCache}
   * @example
   * ```typescript
   * try {
   *   const details = await musicService.getMusicDetailsById(42)
   *   console.log(details.artist[0]?.name)
   * } catch (error) {
   *   if (error instanceof MusicNotFoundError) {
   *     // handle 404
   *   }
   * }
   * ```
   */
  async getMusicDetailsById(id: number): Promise<MusicDetails> {
    return withCache({
      key: musicCache.key(id),
      getCache: () => musicCache.get(id),
      setCache: (_, value) => musicCache.set(id, value),
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
