/**
 * Data access for staff records.
 *
 * @module domains/anime/repositories/staff-repository
 */
import { db } from '@db/client'
import { dbError } from '@shared/errors/db-errors'
import { staff } from '@db/schemas/staff'
import { inArray } from 'drizzle-orm'

/**
 * Repository for querying staff rows from the database.
 *
 * @remarks
 * **Table:** `staff` (people: directors, voice actors, etc.)
 *
 * Used by {@link animeStaffService} and {@link animeCharacterService} (voice cast).
 *
 * @see {@link mapAnimeStaff}
 * @see {@link mapAnimeCharacters}
 */
export const staffRepository = {
  /**
   * Loads multiple staff rows by MAL IDs.
   *
   * @param ids - Staff MAL IDs from join tables
   * @returns Matching {@link StaffDB} rows; `[]` when `ids` is empty
   *
   * @throws {InfraError} (`[GET_MANY_BY_MAL_IDS]`)
   */
  async getManyByMalIds(ids: number[]) {
    try {
      if (!ids.length) return []

      return db.select().from(staff).where(inArray(staff.malId, ids))
    } catch (error) {
      throw dbError('[GET_MANY_BY_MAL_IDS]', { ids }, error)
    }
  },
}
