/**
 * Database access for user profile records.
 *
 * @module domains/user/repositories/user-repository
 * @remarks
 * Thin Drizzle wrapper around the `profile` table. Returns raw
 * {@link UserProfileDB} rows; mapping to API shapes is handled by
 * {@link mapUserProfile} in the service layer.
 * @see {@link profile} for the underlying table schema
 * @see {@link UserProfileDB} for the selected row type
 */
import { db } from '@db/client'
import { profile } from '@db/schemas/profile'
import { dbError } from '@shared/errors/db-errors'
import type { UserProfileDB } from '@domains/user/types/user-db-types'
import { eq } from 'drizzle-orm'

/**
 * Reads user profiles from the `profile` table.
 *
 * @remarks
 * Stateless repository object; safe to import as a singleton.
 * @see {@link userRepository.getUserProfileById}
 */
export const userRepository = {
  /**
   * Loads a profile row by primary key (`profile.id`).
   *
   * @param userId - Target user identifier (matches `profile.id`)
   * @returns Matching {@link UserProfileDB} row, or `undefined` when absent
   * @throws {DbError} When the database query fails
   * @remarks
   * Performs a single-row `SELECT` filtered by `profile.id`. Does not join
   * auth tables. Callers must handle a missing row (typically by throwing
   * {@link UserNotFoundError}).
   * @see {@link UserProfileDB} for column-level field documentation
   * @see {@link userService.getUserProfile} for the primary consumer
   * @example
   * ```typescript
   * const row = await userRepository.getUserProfileById('user-123')
   * if (!row) throw userNotFound('user-123')
   * ```
   */
  async getUserProfileById(userId: string): Promise<UserProfileDB> {
    try {
      const [result] = await db
        .select()
        .from(profile)
        .where(eq(profile.id, userId))

      return result
    } catch (error) {
      throw dbError('[GET_USER_PROFILE]', { userId }, error)
    }
  },
}
