/**
 * Zod schemas for user profile write (create/update) API payloads.
 *
 * @module domains/user/schemas/user-profile-write-schema
 * @remarks
 * Boundary validators for `POST /api/user` and `PATCH /api/user/:userId`. Every
 * object is a {@link z.strictObject} so unrecognized `body`, `params`, or
 * `query` keys are rejected with a 400 instead of being silently stripped —
 * writes never persist fields the API does not model.
 *
 * @see {@link userProfileSchema} for the public read contract
 * @see {@link userService.createUserProfile}
 * @see {@link userService.updateUserProfile}
 */
import { z } from 'zod'

/**
 * Identity-only profile fields that callers may write through the API.
 *
 * @remarks
 * Mirrors the public {@link userProfileSchema} identity surface (`name`,
 * `lastName`, `avatar`, `birthday`, `gender`). Preference and history fields
 * are intentionally excluded — those are governed by other endpoints that
 * land in a later change. Strict: unknown keys fail validation.
 * @see {@link userProfileSchema}
 * @see {@link createUserProfileSchema}
 * @see {@link updateUserProfileSchema}
 */
export const profileIdentitySchema = z.strictObject({
  name: z.string().min(1),
  lastName: z.string().min(1),
  avatar: z.url().optional(),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
})

/**
 * Validates the body for `POST /api/user` profile creation.
 *
 * @returns A Zod schema for the create profile request
 * @throws {ZodError} When validation runs and required identity fields are missing or invalid
 * @remarks
 * The session user id (not a body field) determines ownership. All identity
 * fields except `avatar` and `birthday` are required at create time. Unknown
 * body, params, or query keys are rejected.
 * @see {@link profileIdentitySchema}
 * @see {@link userService.createUserProfile}
 */
export const createUserProfileSchema = z.strictObject({
  body: profileIdentitySchema,
  params: z.strictObject({}).optional().default({}),
  query: z.strictObject({}).optional().default({}),
})

/**
 * Validates the request for `PATCH /api/user/:userId` partial updates.
 *
 * @returns A Zod schema for params + body; body must contain at least one identity field
 * @throws {ZodError} When validation runs and `userId` is missing, the body is empty, or any field is invalid
 * @remarks
 * Body fields are all optional but the schema rejects an empty patch so callers
 * never persist a no-op write. Unknown body, params, or query keys are rejected.
 * @see {@link profileIdentitySchema}
 * @see {@link userService.updateUserProfile}
 */
export const updateUserProfileSchema = z.strictObject({
  params: z.strictObject({
    userId: z.coerce.string(),
  }),
  body: profileIdentitySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one identity field is required',
    }),
  query: z.strictObject({}).optional().default({}),
})
