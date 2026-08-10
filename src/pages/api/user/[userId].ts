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
import {
  getUserProfileSchema,
  updateUserProfileSchema,
  userProfileSchema,
} from '@user/schemas'
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
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: {
 *     id: string
 *     avatar?: string
 *     name: string
 *     lastName: string
 *     birthday?: string
 *     gender: 'male' | 'female' | 'other'
 *     preferences?: {
 *       fanaticLevel?: 'low' | 'medium' | 'high'
 *       frequency?: 'daily' | 'weekly' | 'monthly'
 *       preferredFormat?: string
 *       favoriteGenres?: number[]
 *       favoriteStudios?: number[]
 *       favoriteAnimes?: number[]
 *     }
 *     history?: { watchedAnimes?: number[] }
 *   }
 *   status: 200
 *   meta: {}
 * }
 * ```
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
  withErrorHandling(
    async ({ locals, validated }) => {
      const { userId: targetId } = validated.params
      const { user } = locals
      const userProfile = await userService.getUserProfile({
        userId: user?.id ?? 'anonymous',
        targetId,
      })
      return { data: userProfile, status: 200, meta: {} }
    },
    { responseSchema: userProfileSchema }
  )
)

/**
 * Applies a partial identity update to the profile for the given `userId`.
 *
 * @see {@link file://./docs/patch-profile.md} for detailed request/response documentation
 */
export const PATCH: (context: APIContext) => Promise<Response> =
  withZodValidation(updateUserProfileSchema)(
    withErrorHandling(
      async ({ locals, validated }) => {
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
      },
      { responseSchema: userProfileSchema }
    )
  )
