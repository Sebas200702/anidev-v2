/**
 * Zod schemas for user profile API payloads.
 *
 * @module domains/user/schemas/user-schema
 * @remarks
 * Runtime validators for the public {@link UserProfile} contract and related
 * nested objects. Types in {@link module:domains/user/types/user-types} are
 * inferred from these schemas to keep validation and TypeScript in sync.
 *
 * **Full {@link UserProfile} shape (validated fields)**
 *
 * | Field | Type | Required | Description |
 * | ----- | ---- | -------- | ----------- |
 * | `id` | `string` | yes | Unique profile identifier |
 * | `avatar` | URL `string` | no | Profile image URL |
 * | `name` | `string` (min 1) | yes | Given name |
 * | `lastName` | `string` (min 1) | yes | Family name |
 * | `birthday` | `string` | no | ISO or display date string |
 * | `gender` | `'male' \| 'female' \| 'other'` | yes | Gender identity |
 * | `preferences` | {@link preferencesSchema} | no | Anime taste and engagement prefs |
 * | `history` | {@link historySchema} | no | Watch history lists |
 *
 * @see {@link UserProfile} for the inferred TypeScript type
 * @see {@link userProfileResponseSchema} for the standard API envelope
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import {
  historySchema,
  preferencesSchema,
} from '@domains/user/schemas/user-preferences-schema'

// Re-exported so consumers importing from `@domains/user/schemas/user-schema`
// keep access to the nested preference/history schemas.
export * from '@domains/user/schemas/user-preferences-schema'

/**
 * Validates the public user profile payload.
 *
 * @returns A Zod object schema for {@link UserProfile}
 * @throws {ZodError} When validation runs and any required field is missing or invalid
 * @remarks
 * Top-level profile contract returned by profile read endpoints and cached
 * by {@link userProfileCache}. Nested `preferences` and `history` follow their
 * respective sub-schemas.
 * @see {@link preferencesSchema}
 * @see {@link historySchema}
 * @see {@link mapUserProfile} for DB-to-API transformation
 * @example
 * ```typescript
 * userProfileSchema.parse({
 *   id: 'user-123',
 *   name: 'Ada',
 *   lastName: 'Lovelace',
 *   gender: 'female',
 *   preferences: { favoriteAnimes: [1] },
 *   history: { watchedAnimes: [2, 3] },
 * })
 * ```
 */
export const userProfileSchema = z.object({
  id: z.string(),
  avatar: z.url().optional(),
  name: z.string().min(1),
  lastName: z.string().min(1),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  preferences: preferencesSchema.optional(),
  history: historySchema.optional(),
})

/**
 * Validates the API response wrapping a user profile.
 *
 * @returns A Zod schema for `{ data: UserProfile, ... }` API envelope
 * @throws {ZodError} When validation runs and the envelope or nested profile is invalid
 * @remarks
 * Composes {@link userProfileSchema} with the shared
 * {@link createApiResponseSchema} wrapper used across domain endpoints.
 * @see {@link userProfileSchema}
 * @example
 * ```typescript
 * const response = userProfileResponseSchema.parse({
 *   data: { id: 'u1', name: 'Test', lastName: 'User', gender: 'other' },
 * })
 * ```
 */
export const userProfileResponseSchema =
  createApiResponseSchema(userProfileSchema)

/**
 * Validates route parameters for user profile requests.
 *
 * @returns A Zod object schema for `{ params: { userId }, query?, body? }`
 * @throws {ZodError} When validation runs and `params.userId` cannot be coerced to string
 * @remarks
 * Used by profile GET routes. Coerces `userId` from route params to string.
 * Query defaults to `{}`; body is accepted as unknown for middleware compatibility.
 * @see {@link userService.getUserProfile}
 * @example
 * ```typescript
 * getUserProfileSchema.parse({
 *   params: { userId: '550e8400-e29b-41d4-a716-446655440000' },
 * })
 * ```
 */
export const getUserProfileSchema = z.object({
  params: z.object({
    userId: z.coerce.string(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})
