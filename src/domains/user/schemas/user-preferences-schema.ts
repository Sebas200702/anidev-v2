/**
 * Zod schemas for nested user preference and history objects.
 *
 * @module domains/user/schemas/user-preferences-schema
 * @remarks
 * Sub-schemas composed into {@link userProfileSchema}. Types in
 * {@link module:domains/user/types/user-types} are inferred from these to keep validation and
 * TypeScript in sync.
 *
 * @see {@link userProfileSchema}
 */
import { z } from 'zod'

/**
 * Optional fan engagement level for user preferences.
 *
 * @returns A Zod enum schema accepting `'low'`, `'medium'`, or `'high'`
 * @throws {ZodError} When validation runs and the value is outside the enum
 * @remarks
 * Describes how invested the user is in anime culture. Stored in
 * `profile.fanatic_level` and mapped to {@link UserFanaticLevel}.
 * @see {@link preferencesSchema}
 * @example
 * ```typescript
 * fanaticLevelSchema.parse('high') // 'high'
 * fanaticLevelSchema.parse(undefined) // undefined
 * ```
 */
export const fanaticLevelSchema = z.enum(['low', 'medium', 'high']).optional()

/**
 * Optional viewing frequency for user preferences.
 *
 * @returns A Zod enum schema accepting `'daily'`, `'weekly'`, or `'monthly'`
 * @throws {ZodError} When validation runs and the value is outside the enum
 * @remarks
 * How often the user typically watches anime. Stored in `profile.frequency`
 * and mapped to {@link UserFrequency}.
 * @see {@link preferencesSchema}
 * @example
 * ```typescript
 * frequencySchema.parse('weekly') // 'weekly'
 * ```
 */
export const frequencySchema = z.enum(['daily', 'weekly', 'monthly']).optional()

/**
 * Validates nested user preference fields.
 *
 * @returns A Zod object schema for {@link UserPreferences}
 * @throws {ZodError} When validation runs and any field fails its constraint
 * @remarks
 * **Preference fields:**
 *
 * | Field | Type | Required | Description |
 * | ----- | ---- | -------- | ----------- |
 * | `fanaticLevel` | `'low' \| 'medium' \| 'high'` | no | Engagement level |
 * | `frequency` | `'daily' \| 'weekly' \| 'monthly'` | no | Viewing cadence |
 * | `preferredFormat` | `string` | no | Preferred media format (e.g. TV, movie) |
 * | `favoriteGenres` | `number[]` | no | Taxonomy IDs for favorite genres |
 * | `favoriteStudios` | `number[]` | no | Taxonomy IDs for favorite studios |
 * | `favoriteAnimes` | `number[]` | no | Media IDs for favorite anime titles |
 *
 * Access is restricted by {@link userPolicies.canViewUserPreferences} and
 * {@link userPolicies.canEditUserPreferences} (owner only).
 * @see {@link fanaticLevelSchema}
 * @see {@link frequencySchema}
 * @example
 * ```typescript
 * preferencesSchema.parse({
 *   fanaticLevel: 'medium',
 *   frequency: 'weekly',
 *   favoriteAnimes: [1, 42, 100],
 * })
 * ```
 */
export const preferencesSchema = z.object({
  fanaticLevel: fanaticLevelSchema,
  frequency: frequencySchema,
  preferredFormat: z.string().optional(),
  favoriteGenres: z.array(z.number()).optional(),
  favoriteStudios: z.array(z.number()).optional(),
  favoriteAnimes: z.array(z.number()).optional(),
})

/**
 * Validates watch history fields on a user profile.
 *
 * @returns A Zod object schema for {@link UserHistory}
 * @throws {ZodError} When validation runs and `watchedAnimes` is not a number array
 * @remarks
 * **History fields:**
 *
 * | Field | Type | Required | Description |
 * | ----- | ---- | -------- | ----------- |
 * | `watchedAnimes` | `number[]` | no | Media IDs the user has watched |
 *
 * Access is restricted by {@link userPolicies.canViewUserHistory} and
 * {@link userPolicies.canEditUserHistory} (owner only).
 * @see {@link userProfileSchema}
 * @example
 * ```typescript
 * historySchema.parse({ watchedAnimes: [10, 20, 30] })
 * ```
 */
export const historySchema = z.object({
  watchedAnimes: z.array(z.number()).optional(),
})
