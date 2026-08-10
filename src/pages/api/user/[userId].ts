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
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { userService } from '@user/services/user'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import {
  getUserProfileSchema,
  updateUserProfileSchema,
  userProfileResponseSchema,
} from '@user/schemas'
import { requireAuthSession } from '@auth/utils'
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
  async ({ locals, validated }) => {
    try {
      const { userId: targetId } = validated.params
      const { user } = locals
      const userProfile = await userService.getUserProfile({
        userId: user?.id ?? 'anonymous',
        targetId,
      })

      const payload = {
        data: userProfile,
        status: 200,
        meta: {},
      }

      const responseBody = userProfileResponseSchema.parse(payload)

      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      const { status, body } = mapErrorToHttp(error)

      const payload = {
        data: null,
        status,
        error: body.message ?? 'Unexpected error',
        meta: body.meta ?? {},
      }

      return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
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
 * **Error responses** (envelope `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Body or params fail {@link updateUserProfileSchema} |
 * | 401 | `AUTH_REQUIRED` | No session user present |
 * | 401 | `USER_UNAUTHORIZED` | Path `userId` does not match session id |
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
export const PATCH: APIRoute = withZodValidation(updateUserProfileSchema)(
  async ({ locals, validated }) => {
    try {
      const user = locals.user as User | null
      const sessionId = requireAuthSession({ user })
      const { userId: targetId } = validated.params
      if (targetId !== sessionId) {
        const { status, body } = mapErrorToHttp(
          (await import('@shared/errors/auth-errors')).authForbidden({
            targetId,
          })
        )
        return new Response(
          JSON.stringify({
            data: null,
            status,
            code: body.code,
            error: body.message ?? 'Unexpected error',
            meta: body.meta ?? {},
          }),
          { status, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const profile = await userService.updateUserProfile({
        userId: sessionId,
        targetId,
        input: validated,
      })
      const payload = { data: profile, status: 200, meta: {} }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      const { status, body } = mapErrorToHttp(error)
      return new Response(
        JSON.stringify({
          data: null,
          status,
          code: body.code,
          error: body.message ?? 'Unexpected error',
          meta: body.meta ?? {},
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)
