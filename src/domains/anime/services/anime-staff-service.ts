/**
 * Application service for anime staff data.
 *
 * @module domains/anime/services/anime-staff-service
 */
import type { AnimeStaff } from '@domains/anime/types'
import { animeStaffCache } from '@domains/anime/cache/anime-staff-cache'
import { staffRepository } from '@domains/anime/repositories/staff-repository'
import { withCache } from '@lib/cache'
import { mapAnimeStaff } from '@domains/anime/mappers/anime-staff-mapper'
import { animeStaffRepository } from '@domains/anime/repositories/anime-staff-repository'

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
   * @returns {@link AnimeStaff}[] with person URLs and split `positions`
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const staff = await animeStaffService.getAnimeStaff(1)
   * // [{ person: { malId, name, imageUrl, url }, positions: ['Director'] }]
   * ```
   */
  async getAnimeStaff(malId: number): Promise<AnimeStaff[]> {
    return withCache({
      key: animeStaffCache.key(malId),
      getCache: () => animeStaffCache.get(malId),
      setCache: (_, value) => animeStaffCache.set(malId, value),
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
