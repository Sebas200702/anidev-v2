/**
 * Inferred API types for user profile payloads.
 *
 * @module domains/user/types/user-types
 * @remarks
 * TypeScript types derived from {@link module:domains/user/schemas/user-schema}
 * via `z.infer`. These are the canonical API shapes for profile responses,
 * nested preferences, and watch history.
 * @see {@link userProfileSchema} for runtime validation
 * @see {@link mapUserProfile} for DB-to-type mapping
 */
import {
  userProfileSchema,
  preferencesSchema,
  historySchema,
  frequencySchema,
  fanaticLevelSchema,
} from '@domains/user/schemas/user-schema'
import { z } from 'zod'

/**
 * Public user profile response shape.
 *
 * @remarks
 * **Full profile fields:**
 *
 * | Property | Type | Required | Description |
 * | -------- | ---- | -------- | ----------- |
 * | `id` | `string` | yes | Unique profile identifier (matches `profile.id`) |
 * | `avatar` | `string` (URL) | no | Profile image URL; defaults to placeholder when mapped from null DB value |
 * | `name` | `string` | yes | User given name |
 * | `lastName` | `string` | yes | User family name |
 * | `birthday` | `string` | no | Birth date string as stored/displayed |
 * | `gender` | `'male' \| 'female' \| 'other'` | yes | Gender identity |
 * | `preferences` | {@link UserPreferences} | no | Nested anime taste and engagement preferences |
 * | `history` | {@link UserHistory} | no | Nested watch history lists |
 *
 * Profile **viewing** is public ({@link userPolicies.canViewUserProfile}).
 * Preference and history **viewing/editing** require ownership.
 * @see {@link userProfileSchema}
 * @see {@link UserPreferences}
 * @see {@link UserHistory}
 * @example
 * ```typescript
 * const profile: UserProfile = {
 *   id: 'user-123',
 *   avatar: 'https://cdn.example/avatar.webp',
 *   name: 'Ada',
 *   lastName: 'Lovelace',
 *   birthday: '1815-12-10',
 *   gender: 'female',
 *   preferences: {
 *     fanaticLevel: 'high',
 *     frequency: 'daily',
 *     preferredFormat: 'TV',
 *     favoriteGenres: [1, 4],
 *     favoriteStudios: [7],
 *     favoriteAnimes: [100, 200],
 *   },
 *   history: {
 *     watchedAnimes: [100, 201, 305],
 *   },
 * }
 * ```
 */
export type UserProfile = z.infer<typeof userProfileSchema>

/**
 * Nested user preference fields on a profile.
 *
 * @remarks
 * **Preference properties:**
 *
 * | Property | Type | Required | Description |
 * | -------- | ---- | -------- | ----------- |
 * | `fanaticLevel` | {@link UserFanaticLevel} | no | Self-reported anime engagement level |
 * | `frequency` | {@link UserFrequency} | no | Typical viewing cadence |
 * | `preferredFormat` | `string` | no | Preferred format label (e.g. TV, OVA, movie) |
 * | `favoriteGenres` | `number[]` | no | Favorite genre taxonomy IDs |
 * | `favoriteStudios` | `number[]` | no | Favorite studio/producer taxonomy IDs |
 * | `favoriteAnimes` | `number[]` | no | Favorite anime media IDs |
 *
 * Private to the profile owner per {@link userPolicies.canViewUserPreferences}
 * and {@link userPolicies.canEditUserPreferences}.
 * @see {@link preferencesSchema}
 * @example
 * ```typescript
 * const prefs: UserPreferences = {
 *   fanaticLevel: 'medium',
 *   frequency: 'weekly',
 *   favoriteAnimes: [1, 2, 3],
 * }
 * ```
 */
export type UserPreferences = z.infer<typeof preferencesSchema>

/**
 * User watch history fields nested under a profile.
 *
 * @remarks
 * **History properties:**
 *
 * | Property | Type | Required | Description |
 * | -------- | ---- | -------- | ----------- |
 * | `watchedAnimes` | `number[]` | no | Anime media IDs the user has watched |
 *
 * Private to the profile owner per {@link userPolicies.canViewUserHistory}
 * and {@link userPolicies.canEditUserHistory}.
 * @see {@link historySchema}
 * @example
 * ```typescript
 * const history: UserHistory = { watchedAnimes: [10, 20, 30] }
 * ```
 */
export type UserHistory = z.infer<typeof historySchema>

/**
 * Viewing frequency preference value.
 *
 * @remarks
 * One of `'daily'`, `'weekly'`, or `'monthly'`. Optional on
 * {@link UserPreferences}.
 * @see {@link frequencySchema}
 * @example
 * ```typescript
 * const freq: UserFrequency = 'weekly'
 * ```
 */
export type UserFrequency = z.infer<typeof frequencySchema>

/**
 * Fan engagement level preference value.
 *
 * @remarks
 * One of `'low'`, `'medium'`, or `'high'`. Optional on
 * {@link UserPreferences}.
 * @see {@link fanaticLevelSchema}
 * @example
 * ```typescript
 * const level: UserFanaticLevel = 'high'
 * ```
 */
export type UserFanaticLevel = z.infer<typeof fanaticLevelSchema>
