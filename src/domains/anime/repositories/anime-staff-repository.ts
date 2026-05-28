/**
 * Data access for anime-staff join records.
 *
 * @module domains/anime/repositories/anime-staff-repository
 */
import { animeStaff } from '@db/schemas/anime-relations'
import { db } from '@db/client'
import { eq } from 'drizzle-orm'
import type { AnimeStaffDB } from '@domains/anime/types'
import { dbError } from '@shared/errors/db-errors'

/**
 * Repository for querying staff credits linked to an anime.
 *
 * @remarks
 * **Table:** `anime_staff` (`anime_id`, `staff_id`, `role`)
 *
 * **SQL:** `SELECT * FROM anime_staff WHERE anime_id = ?`
 *
 * **Empty vs null:** Returns `[]` when the anime has no staff credits (not an error).
 * Does not join `staff` — {@link staffRepository} resolves person rows.
 *
 * @see {@link animeStaffService}
 * @see {@link mapAnimeStaff}
 * @see {@link staffRepository.getManyByMalIds}
 */
export const animeStaffRepository = {
  /**
   * Loads staff relation rows for an anime.
   *
   * @param malId - Parent anime MAL ID (`anime_staff.anime_id`)
   * @returns {@link AnimeStaffDB} join rows including comma-separated `role` strings
   *
   * @throws {InfraError} On database failure (`[GET_ANIME_STAFF_BY_ANIME_MAL_ID]`)
   *
   * @example
   * ```typescript
   * const refs = await animeStaffRepository.getAnimeStaffByAnimeMalId(1)
   * const staff = await staffRepository.getManyByMalIds(refs.map((r) => r.staffId))
   * ```
   */
  async getAnimeStaffByAnimeMalId(malId: number): Promise<AnimeStaffDB[]> {
    try {
      return await db
        .select()
        .from(animeStaff)
        .where(eq(animeStaff.animeId, malId))
    } catch (error) {
      throw dbError('[GET_ANIME_STAFF_BY_ANIME_MAL_ID]', { malId }, error)
    }
  },
}
