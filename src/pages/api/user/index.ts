/**
 * Profile creation API endpoint.
 *
 * @module pages/api/user/index
 *
 * **Route:** `POST /api/user`
 *
 * **Authentication:** Required — only the session user may create their own
 * profile. {@link requireAuthSession} throws `AUTH_REQUIRED` (401) when the
 * middleware did not populate an actor.
 *
 * Creates a profile row for the authenticated actor and returns the mapped
 * profile in the standard API envelope. Conflicts (a profile already exists)
 * surface as HTTP 409 via {@link mapErrorToHttp}.
 *
 * @see {@link createUserProfileSchema} — request validation schema
 * @see {@link userService.createUserProfile} — write service
 * @see {@link requireAuthSession} — auth gate
 * @see {@link withErrorHandling} — route wrapper
 */

import type { APIContext } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import { userService } from '@user/services/user'
import { createUserProfileSchema } from '@user/schemas'
import { requireAuthSession } from '@auth/utils'
import type { User } from '@lib/auth/server'

/**
 * Creates a profile for the session user.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Body | `name` | `string` | Yes | Given name |
 * | Body | `lastName` | `string` | Yes | Family name |
 * | Body | `gender` | `'male' \| 'female' \| 'other'` | Yes | Gender identity |
 * | Body | `avatar` | URL `string` | No | Profile image URL |
 * | Body | `birthday` | `string` | No | ISO or display date string |
 *
 * **Success response — `201 Created`**
 *
 * ```typescript
 * {
 *   data: UserProfile
 *   status: 201
 *   meta: {}
 * }
 * ```
 *
 * **Error responses** (envelope `{ data: null, status, error, code, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Body fails {@link createUserProfileSchema} |
 * | 401 | `AUTH_REQUIRED` | No session user present |
 * | 400 | `USER_UNAUTHORIZED` | Policy denies edit for the actor |
 * | 409 | `USER_PROFILE_CONFLICT` | A profile already exists for the actor |
 * | 503 | `DB_ERROR` | Underlying database failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -X POST "http://localhost:4321/api/user" \
 *   -H "Content-Type: application/json" \
 *   -b cookies.txt \
 *   -d '{"name":"Ada","lastName":"Lovelace","gender":"female"}'
 * ```
 */
export const POST: (context: APIContext) => Promise<Response> =
  withZodValidation(createUserProfileSchema)(
    withErrorHandling(async ({ locals, validated }) => {
      const user = locals.user as User | null
      const userId = requireAuthSession({ user })
      const profile = await userService.createUserProfile({
        userId,
        input: validated,
      })
      return { data: profile, status: 201, meta: {} }
    })
  )
