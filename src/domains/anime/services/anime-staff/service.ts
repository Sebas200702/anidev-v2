/**
 * Application service for anime staff data.
 *
 * @module domains/anime/services/anime-staff/service
 */
import type { AnimeStaff } from '@anime/types'
import { animeStaffCache } from '@anime/cache/anime-staff'
import { staffRepository } from '@anime/repositories/staff'
import { withCache } from '@lib/cache'
import { mapAnimeStaff } from '@anime/mappers/anime-staff'
import { animeStaffRepository } from '@anime/repositories/anime-staff'

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
