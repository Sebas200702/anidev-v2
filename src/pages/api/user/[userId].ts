/**
 * Public user profile API endpoint.
 *
 * @module pages/api/user/[userId]
 *
 * **Route:** `GET /api/user/:userId`, `PATCH /api/user/:userId`
 *
 * **Authentication:**
 * - `GET` is session-optional — profile reads are public per
 *   {@link userPolicies.canViewUserProfile}. When no session is present the actor is
 *   treated as `'anonymous'`.
 * - `PATCH` is session-required and owner-only — the path `userId` MUST equal
 *   the session user id; {@link requireAuthSession} enforces the gate.
 *
 * @see {@link getUserProfileSchema} — read request validation
 * @see {@link updateUserProfileSchema} — patch request validation
 * @see {@link userService.getUserProfile} — read service
 * @see {@link userService.updateUserProfile} — write service
 * @see {@link requireAuthSession} — write auth gate
 * @see {@link withErrorHandling} — error-to-HTTP envelope wrapper
 */

import type { APIContext, APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import { userService } from '@user/services/user'
import { getUserProfileSchema, updateUserProfileSchema } from '@user/schemas'
import { requireAuthSession } from '@auth/utils'
import { authForbidden } from '@shared/errors/auth-errors'
import type { User } from '@lib/auth/server'

/**
 * Returns a public user profile for the given user ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `userId` | `string` | Yes | Target user identifier |
 *
 * Session context is read from `locals.user` (populated by auth middleware) but is
 * not required for public profile access.
 *
 * **Success response — `200 OK`:** `{ data: UserProfile, status: 200, meta: {} }` See
 * {@link userProfileSchema} for the full validated `data` shape.
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `userId` param fails {@link getUserProfileSchema} validation |
 * | 400 | `USER_INVALID_ID` | User ID is malformed |
 * | 403 | `USER_UNAUTHORIZED` | Caller lacks permission to view the profile |
 * | 404 | `USER_NOT_FOUND` | No user exists for the given ID |
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/user/usr_abc123"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/user/usr_abc123', { credentials: 'include' })
 * const { data } = await res.json()
 * // data: UserProfile
 * ```
 */
export const GET: APIRoute = withZodValidation(getUserProfileSchema)(
  withErrorHandling(async ({ locals, validated }) => {
    const { userId: targetId } = validated.params
    const { user } = locals
    const userProfile = await userService.getUserProfile({
      userId: user?.id ?? 'anonymous',
      targetId,
    })
    return { data: userProfile, status: 200, meta: {} }
  })
)

/**
 * Applies a partial identity update to the profile for the given `userId`.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `userId` | `string` | Yes | Target user (must equal session id) |
 * | Body | `name` | `string` | No | Given name |
 * | Body | `lastName` | `string` | No | Family name |
 * | Body | `avatar` | URL `string` | No | Profile image URL |
 * | Body | `birthday` | `string` | No | ISO or display date string |
 * | Body | `gender` | `'male' \| 'female' \| 'other'` | No | Gender identity |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * { data: UserProfile, status: 200, meta: {} }
 * ```
 *
 * **Error responses** (envelope `{ data: null, status, error, code, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Body or params fail {@link updateUserProfileSchema} |
 * | 401 | `AUTH_REQUIRED` | No session user present |
 * | 403 | `AUTH_FORBIDDEN` | Path `userId` does not match session id |
 * | 400 | `USER_UNAUTHORIZED` | Policy denies edit for the actor |
 * | 404 | `USER_NOT_FOUND` | No profile row for the target id |
 * | 503 | `DB_ERROR` | Database update failed |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -X PATCH "http://localhost:4321/api/user/usr_abc" \
 *   -H "Content-Type: application/json" \
 *   -b cookies.txt \
 *   -d '{"name":"Grace"}'
 * ```
 */
export const PATCH: (context: APIContext) => Promise<Response> =
  withZodValidation(updateUserProfileSchema)(
    withErrorHandling(async ({ locals, validated }) => {
      const user = locals.user as User | null
      const sessionId = requireAuthSession({ user })
      const { userId: targetId } = validated.params
      if (targetId !== sessionId) {
        throw authForbidden({ targetId, sessionId })
      }

      const profile = await userService.updateUserProfile({
        userId: sessionId,
        targetId,
        input: validated,
      })
      return { data: profile, status: 200, meta: {} }
    })
  )
