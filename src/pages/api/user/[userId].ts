/**
 * Public user profile API endpoint.
 *
 * @module pages/api/user/[userId]
 *
 * **Route:** `GET /api/user/:userId`
 *
 * **Authentication:** Session optional — profile reads are public per
 * {@link userPolicies.canViewUserProfile}. When no session is present the actor is
 * treated as `'anonymous'`. Not listed in {@link publicRoutes}; middleware may clear
 * invalid session locals but does not block unauthenticated profile reads.
 *
 * Returns a public user profile including preferences and watch history fields.
 *
 * @see {@link getUserProfileSchema} — request validation schema
 * @see {@link userProfileResponseSchema} — response validation schema
 * @see {@link userService.getUserProfile} — profile query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { userService } from '@domains/user/services/user-service'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import {
  getUserProfileSchema,
  userProfileResponseSchema,
} from '@domains/user/schemas/user-schema'

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
export const GET: APIRoute = withZodValidation(getUserProfileSchema)(async ({
  locals,
  validated,
}) => {
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
})
