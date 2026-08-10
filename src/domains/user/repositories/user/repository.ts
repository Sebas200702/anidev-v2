/**
 * Database access for user profile records.
 *
 * @module domains/user/repositories/user/repository
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
import type { NewUserProfileDB, UserProfileDB } from '@user/types/user-db-types'
import { eq } from 'drizzle-orm'

/**
 * Reads and writes user profile records.
 *
 * @remarks
 * Stateless repository object; safe to import as a singleton.
 * @see {@link userRepository.getUserProfileById}
 * @see {@link userRepository.createProfile}
 * @see {@link userRepository.updateProfile}
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

  /**
   * Inserts a profile row and returns the persisted record.
   *
   * @param values - {@link NewUserProfileDB} row built by the reverse mapper
   * @returns Inserted {@link UserProfileDB} row
   * @throws {DbError} When the database insert fails (e.g. duplicate id, FK violation)
   * @remarks
   * Conflict detection (duplicate id) is handled in the service layer by
   * calling {@link userRepository.getUserProfileById} first. A unique
   * violation thrown here is also caught and re-thrown via {@link dbError}.
   * @see {@link mapProfileIdentityToDb}
   * @see {@link userService.createUserProfile}
   * @example
   * ```typescript
   * const row = await userRepository.createProfile({
   *   id: sessionId, userId: sessionId, name: 'Ada', lastName: 'Lovelace', gender: 'female',
   * })
   * ```
   */
  async createProfile(values: NewUserProfileDB): Promise<UserProfileDB> {
    try {
      const [row] = await db.insert(profile).values(values).returning()
      return row
    } catch (error) {
      throw dbError('[CREATE_USER_PROFILE]', { id: values.id }, error)
    }
  },

  /**
   * Applies a partial update to a profile row by primary key.
   *
   * @param userId - Profile id to update
   * @param patch - Sparse update payload (only fields to change)
   * @returns Updated {@link UserProfileDB} row, or `undefined` when no row matched
   * @throws {DbError} When the database update fails
   * @remarks
   * Returns `undefined` so the service layer can surface {@link UserNotFoundError}
   * rather than a 200 with no change. The patch is forwarded to Drizzle's
   * `set` so unspecified columns remain unchanged.
   * @see {@link mapProfileIdentityPatchToDb}
   * @see {@link userService.updateUserProfile}
   * @example
   * ```typescript
   * const row = await userRepository.updateProfile('user-1', { name: 'Grace' })
   * if (!row) throw userNotFound('user-1')
   * ```
   */
  async updateProfile(
    userId: string,
    patch: Partial<NewUserProfileDB>
  ): Promise<UserProfileDB | undefined> {
    try {
      const [row] = await db
        .update(profile)
        .set(patch)
        .where(eq(profile.id, userId))
        .returning()
      return row
    } catch (error) {
      throw dbError('[UPDATE_USER_PROFILE]', { userId }, error)
    }
  },
}
