/**
 * Barrel exports for user domain Zod schemas.
 *
 * @module domains/user/schemas
 * @remarks
 * Re-exports runtime validation schemas for user profile API payloads,
 * nested preference/history objects, and route parameter parsing.
 * @see {@link module:domains/user/schemas/user-schema} for schema definitions
 * @example
 * ```typescript
 * import { userProfileSchema, getUserProfileSchema } from '@user/schemas'
 * ```
 */

export {
  fanaticLevelSchema,
  frequencySchema,
  preferencesSchema,
  historySchema,
} from './user-preferences-schema'
export {
  userProfileSchema,
  userProfileResponseSchema,
  getUserProfileSchema,
} from './user-schema'
export {
  profileIdentitySchema,
  createUserProfileSchema,
  updateUserProfileSchema,
} from './user-profile-write-schema'
export {
  userListStatusSchema,
  userListEntrySchema,
  userListRequestSchema,
  userListDeleteRequestSchema,
  getUserListRequestSchema,
  userListResponseSchema,
  userListMutationResponseSchema,
  userListDeleteResponseSchema,
} from './user-list-schema'
export {
  watchProgressEntrySchema,
  getWatchProgressRequestSchema,
  putWatchProgressRequestSchema,
  watchProgressResponseSchema,
  watchProgressMutationResponseSchema,
} from './watch-progress-schema'
export type { WatchProgressEntry } from './watch-progress-schema'
