/**
 * Application service for anime staff data.
 *
 * @module domains/anime/services/anime-staff-service
 */
import type { AnimeStaff } from '@anime/types'
import { animeStaffCache } from '@anime/cache/anime-staff-cache'
import { staffRepository } from '@anime/repositories/staff-repository'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mapAnimeStaff } from '@anime/mappers/anime-staff-mapper'
import { animeStaffRepository } from '@anime/repositories/anime-staff-repository'

/**
 * Coordinates repository access, mapping, and caching for anime staff lists.
 *
 * @remarks
 * **Pipeline:** `anime:staff:{malId}` → `animeStaffRepository` (join rows) →
 * `staffRepository.getManyByMalIds` → `mapAnimeStaff` → cache `set`
 *
 * **Cache TTL:** {@link CacheTtl.Long} (86400 s)
 *
 * **Domain errors:** None — empty staff returns `[]`
 *
 * @see {@link animeStaffCache}
 */
export const animeStaffService = {
  /**
   * Loads production staff for an anime, using cache when available.
   *
   * @param malId - Parent anime MAL ID
   * @returns `{ value, isStale }` — {@link AnimeStaff}[] with person URLs and
   * split `positions`, plus a stale flag
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const { value: staff, isStale } = await animeStaffService.getAnimeStaff(1)
   * // [{ person: { malId, name, imageUrl, url }, positions: ['Director'] }]
   * ```
   */
  async getAnimeStaff(malId: number): Promise<StaleResult<AnimeStaff[]>> {
    return withStaleCache({
      key: animeStaffCache.key(malId),
      staleKey: `${animeStaffCache.key(malId)}:stale`,
      getCache: () => animeStaffCache.get(malId),
      getStaleCache: (key) => cacheGet<AnimeStaff[]>(key),
      setCache: (_, value) => animeStaffCache.set(malId, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const staffRefs =
          await animeStaffRepository.getAnimeStaffByAnimeMalId(malId)

        const staffIds = staffRefs.map((ref) => ref.staffId)
        const staff = await staffRepository.getManyByMalIds(staffIds)
        return mapAnimeStaff({
          staff,
          animeStaff: staffRefs,
        })
      },
    })
  },
}
