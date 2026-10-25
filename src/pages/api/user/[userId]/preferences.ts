/**
 * Profile preferences write endpoint.
 *
 * @module pages/api/user/[userId]/preferences
 *
 * **Route:** `PATCH /api/user/:userId/preferences` — authenticated, owner only.
 *
 * Saves the taste profile collected in onboarding (it feeds recommendations).
 *
 * @see {@link updateUserPreferencesSchema} — request validation schema
 * @see {@link userPreferencesService.updatePreferences} — write service
 */
import type { APIContext } from 'astro'
import { requireAuthSession } from '@auth/utils'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import type { User } from '@lib/auth/server'
import { authForbidden } from '@shared/errors/auth-errors'
import {
  updateUserPreferencesSchema,
  type PreferencesUpdate,
} from '@user/schemas/user-preferences-write-schema'
import { userProfileResponseSchema } from '@user/schemas/user-schema'
import { userPreferencesService } from '@user/services/user-preferences'

type Validated = { params: { userId: string }; body: PreferencesUpdate }

/**
 * Updates any non-empty subset of the owner's preferences.
 *
 * @remarks
 * **Body** (all optional, at least one): `fanaticLevel` (`low|medium|high`),
 * `frequency` (`daily|weekly|monthly`), `preferredFormat`
 * (`tv|movie|ova|ona|special|music`), `favoriteGenres` / `favoriteStudios` /
 * `favoriteAnimes` (unique MAL ids, ≤ 50; `[]` clears).
 *
 * **Success:** `200` with the updated profile (cache invalidated).
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Bad body, or ids with no catalog row (`meta.details.unknownIds`) |
 * | 401 | `AUTH_REQUIRED` | No session |
 * | 403 | `AUTH_FORBIDDEN` | `:userId` is not the session user |
 * | 404 | `USER_NOT_FOUND` | The owner has no profile yet |
 *
 * @example
 * ```bash
 * curl -X PATCH "http://localhost:4321/api/user/<id>/preferences" -b cookies.txt \
 *   -H 'Content-Type: application/json' -d '{"fanaticLevel":"high","favoriteGenres":[1,4]}'
 * ```
 */
export const PATCH: (context: APIContext) => Promise<Response> =
  withZodValidation(updateUserPreferencesSchema)(
    withErrorHandling(
      async ({ locals, validated }: APIContext & { validated: Validated }) => {
        const sessionId = requireAuthSession({
          user: locals.user as User | null,
        })
        const { userId: targetId } = validated.params
        if (targetId !== sessionId) {
          throw authForbidden({ targetId, sessionId })
        }

        const profile = await userPreferencesService.updatePreferences({
          userId: sessionId,
          targetId,
          input: validated.body,
        })
        return {
          data: profile,
          status: 200,
          meta: {},
          headers: new Headers({ 'Cache-Control': 'private, no-store' }),
        }
      },
      { responseSchema: userProfileResponseSchema }
    )
  )
