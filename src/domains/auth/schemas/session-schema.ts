/**
 * Zod schema for Better Auth session lookup responses.
 *
 * @module domains/auth/schemas/session-schema
 * @remarks
 * Validates the shape returned by Better Auth `getSession`. Both `user` and `session` are
 * `null` when the request is unauthenticated.
 *
 * @see {@link sessionService.getSession} — produces data matching this shape
 * @see {@link resolveAuthActor} — extracts `user` and `session` for Astro locals
 */
import { z } from 'zod'

/**
 * Validates session lookup responses from Better Auth `getSession`.
 *
 * @remarks
 * **Fields**:
 * - `user` — nullable object:
 *   - `id` — `string`, user identifier
 *   - `email` — `string`, user email
 *   - `name` — `string`, display name
 * - `session` — nullable object:
 *   - `id` — `string`, session identifier
 *   - `userId` — `string`, owning user id
 *   - `expiresAt` — `Date`, coerced from ISO string via `z.coerce.date()`
 *
 * Both `user` and `session` are `null` when the request is unauthenticated.
 *
 * @see {@link sessionService.getSession} — produces data matching this shape
 * @see {@link resolveAuthActor} — extracts `user` and `session` for Astro locals
 *
 * @example
 * ```typescript
 * const sessionData = await sessionService.getSession(request.headers)
 * const validated = sessionResponseSchema.parse(sessionData)
 * ```
 */
export const sessionResponseSchema = z.object({
  user: z
    .object({
      /** Better Auth user identifier. */
      id: z.string(),
      /** User email address. */
      email: z.string(),
      /** User display name. */
      name: z.string(),
    })
    .nullable(),
  session: z
    .object({
      /** Better Auth session identifier. */
      id: z.string(),
      /** ID of the user this session belongs to. */
      userId: z.string(),
      /** Session expiration timestamp (coerced to Date). */
      expiresAt: z.coerce.date(),
    })
    .nullable(),
})
